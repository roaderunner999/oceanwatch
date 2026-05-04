'use strict';

const express            = require('express');
const { v4: uuidv4 }     = require('uuid');
const { validateImage }  = require('../utils/validateImage');
const { analyzeFrame }   = require('../utils/anthropic');
const { dailyScanLimit } = require('../middleware/rateLimiter');
const store              = require('./store');

const router = express.Router();

// Submersion timers keyed by sessionId:personId
const submersionTimers = {};
const WARNING_MS = parseInt(process.env.SUBMERSION_WARNING_SECONDS || '5')  * 1000;
const DANGER_MS  = parseInt(process.env.SUBMERSION_DANGER_SECONDS  || '10') * 1000;

function updateTimers(sessionId, persons, now) {
  const activeKeys = new Set();
  (persons || []).forEach(p => {
    if (!p.submerged && !p.faceDown) return;
    const key = `${sessionId}:${p.id}`;
    activeKeys.add(key);
    if (!submersionTimers[key]) submersionTimers[key] = { submergedSince: now };
  });
  Object.keys(submersionTimers).forEach(k => {
    if (k.startsWith(sessionId + ':') && !activeKeys.has(k)) delete submersionTimers[k];
  });
}

function buildAlerts(sessionId, persons, now) {
  const alerts = [];
  (persons || []).forEach(p => {
    const key   = `${sessionId}:${p.id}`;
    const timer = submersionTimers[key];
    if (timer) {
      const elapsed = now - timer.submergedSince;
      const seconds = Math.round(elapsed / 1000);
      if (elapsed >= DANGER_MS)  alerts.push({ type: 'extreme', personId: p.id, message: `${p.id} submerged ${seconds}s — possible drowning!`, seconds });
      else if (elapsed >= WARNING_MS) alerts.push({ type: 'high', personId: p.id, message: `${p.id} submerged ${seconds}s — monitor closely`, seconds });
    }
    if (p.distressSignal) alerts.push({ type: 'extreme', personId: p.id, message: `Distress signal detected — ${p.id}`, seconds: 0 });
    if (p.armWaving)      alerts.push({ type: 'high',    personId: p.id, message: `Arm waving detected — ${p.id}`, seconds: 0 });
    if (p.faceDown)       alerts.push({ type: 'extreme', personId: p.id, message: `Face-down float detected — ${p.id}`, seconds: 0 });
  });
  return alerts;
}

router.post('/', dailyScanLimit, async (req, res, next) => {
  const scanId    = uuidv4();
  const startedAt = Date.now();
  store.stats.totalScans += 1;

  try {
    const { imageData, mediaType = 'image/jpeg', sessionId = 'unknown', timestamp } = req.body;

    const validation = validateImage({ imageData, mediaType });
    if (!validation.valid) {
      return res.status(400).json({ ok: false, error: validation.error });
    }

    const result = await analyzeFrame(imageData, mediaType);
    const now    = timestamp || Date.now();

    updateTimers(sessionId, result.persons, now);
    const alerts = buildAlerts(sessionId, result.persons, now);

    store.stats.successScans += 1;
    if ((result.score || 0) >= 76) store.stats.extremeScans   += 1;
    if (result.ripCurrentDetected)  store.stats.ripDetected    += 1;
    if (alerts.length)              store.stats.alertsTriggered += alerts.length;

    // ── Broadcast to nearby users if extreme risk ──────────────────────────
    const { lat, lng } = req.body;
    if (typeof global.broadcastNearby === 'function' && lat && lng) {
      const shouldBroadcast =
        (result.score || 0) >= 76 ||
        alerts.some(a => a.type === 'extreme') ||
        (result.ripCurrentSeverity === 'confirmed' || result.ripCurrentSeverity === 'likely') ||
        result.vesselEmergency === true;

      if (shouldBroadcast) {
        const summary = alerts.length
          ? alerts.find(a => a.type === 'extreme')?.message || alerts[0].message
          : result.summary || 'Hazard detected nearby';

        global.broadcastNearby({
          originSessionId : sessionId,
          lat, lng,
          radiusM         : 500,
          payload         : {
            tier       : result.tier,
            score      : result.score,
            summary,
            ripCurrent : result.ripCurrentDetected ? result.ripCurrentSeverity : null,
            wildlife   : result.wildlifeDetected   ? (result.wildlife?.[0]?.species || null) : null,
            timestamp  : Date.now(),
          },
        });
      }
    }

    const durationMs = Date.now() - startedAt;

    store.addToHistory({
      scanId,
      time      : new Date().toISOString(),
      tier      : result.tier   || 'low',
      score     : result.score  || 0,
      alerts    : alerts.length,
      summary   : (result.summary || '').split('.')[0] + '.',
      durationMs,
      sessionId,
      ip        : (req.ip || '').replace('::ffff:', '').slice(0, 15),
    });

    console.log(`[SCAN] id=${scanId} score=${result.score} tier=${result.tier} alerts=${alerts.length} ip=${req.ip} ${durationMs}ms`);

    return res.status(200).json({ ok: true, scanId, result, alerts, durationMs });

  } catch (err) {
    store.stats.errorScans += 1;
    store.addToHistory({
      scanId,
      time      : new Date().toISOString(),
      tier      : 'error',
      score     : 0,
      alerts    : 0,
      summary   : err.message || 'Scan failed',
      durationMs: Date.now() - startedAt,
      sessionId : req.body?.sessionId || 'unknown',
      ip        : (req.ip || '').replace('::ffff:', '').slice(0, 15),
    });
    console.error(`[SCAN ERROR] id=${scanId}`, err.message);
    if (err.status) return res.status(err.status).json({ ok: false, error: err.message });
    next(err);
  }
});

module.exports = router;
