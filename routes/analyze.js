'use strict';

const express            = require('express');
const { v4: uuidv4 }     = require('uuid');
const { validateImage }  = require('../utils/validateImage');
const { analyzeFrame }   = require('../utils/anthropic');
const { dailyScanLimit } = require('../middleware/rateLimiter');
const store              = require('./store');

const router = express.Router();

// POST /api/analyze
router.post(
  '/',
  dailyScanLimit,
  async (req, res, next) => {
    const scanId    = uuidv4();
    const startedAt = Date.now();
    store.stats.totalScans += 1;

    try {
      const { imageData, mediaType = 'image/jpeg', sessionId } = req.body;

      const validation = validateImage({ imageData, mediaType });
      if (!validation.valid) {
        return res.status(400).json({ ok: false, error: validation.error });
      }

      const result = await analyzeFrame(imageData, mediaType);

      if (res.locals.incrementScanCount) res.locals.incrementScanCount();

      store.stats.successScans += 1;
      if ((result.score || 0) >= 76) store.stats.extremeScans += 1;
      if (result.ripCurrentDetected)  store.stats.ripDetected  += 1;

      const durationMs = Date.now() - startedAt;

      // Build alerts count for stats
      const hasSwimmerAlert = (result.persons || []).some(p =>
        p.submerged || p.faceDown || p.armWaving || p.distressSignal
      );
      const hasWaterAlert = result.ripCurrentDetected ||
        result.waterConditions === 'rough' ||
        result.waterConditions === 'very_rough';

      if (hasSwimmerAlert || hasWaterAlert) store.stats.alertsTriggered += 1;

      store.addToHistory({
        scanId,
        time      : new Date().toISOString(),
        tier      : result.tier   || 'low',
        score     : result.score  || 0,
        alerts    : (hasSwimmerAlert || hasWaterAlert) ? 1 : 0,
        summary   : (result.summary || '').split('.')[0] + '.',
        durationMs,
        sessionId : sessionId || 'unknown',
        ip        : (req.ip || '').replace('::ffff:', '').slice(0, 15),
      });

      console.log(`[SCAN] id=${scanId} score=${result.score} tier=${result.tier} ip=${req.ip} ${durationMs}ms`);

      return res.status(200).json({
        ok        : true,
        scanId,
        result,
        alerts    : [],
        durationMs,
      });

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

      console.error(`[SCAN ERROR] id=${scanId} ip=${req.ip}`, err.message);
      if (err.status) return res.status(err.status).json({ ok: false, error: err.message });
      next(err);
    }
  }
);

module.exports = router;
