'use strict';

const path = require('path');

try {
  const result = require('dotenv').config({ path: path.join(__dirname, '.env') });
  if (result.error) console.log('[startup] No .env file found — using environment variables');
  else console.log('[startup] .env loaded');
} catch(e) { console.log('[startup] dotenv not available'); }

const apiKey = (process.env.ANTHROPIC_API_KEY || '').trim();
global.ANTHROPIC_API_KEY = apiKey;
if (apiKey && !apiKey.startsWith('sk-ant-your')) {
  console.log('✅  API key loaded, prefix:', apiKey.slice(0, 18) + '...');
} else {
  console.error('❌  ANTHROPIC_API_KEY missing — add it to .env or server environment');
}

const express    = require('express');
const http       = require('http');
const WebSocket  = require('ws');
const helmet     = require('helmet');
const cors       = require('cors');
const morgan     = require('morgan');

const { globalRateLimiter } = require('./middleware/rateLimiter');
const { validateApiKey }    = require('./middleware/auth');
const analyzeRouter         = require('./routes/analyze');
const healthRouter          = require('./routes/health');
const statsRouter           = require('./routes/stats');

const app    = express();
const server = http.createServer(app);

// Trust Nginx reverse proxy — required for correct IP in rate limiting
app.set('trust proxy', 1);

// ── WebSocket server ──────────────────────────────────────────────────────────
const wss = new WebSocket.Server({ server, path: '/ws' });

// Connected clients: Map<ws, { sessionId, lat, lng, connectedAt }>
const clients = new Map();

// Last known positions — persists for 60s after disconnect so admin map stays populated
const lastKnown = new Map(); // sessionId -> { lat, lng, lastSeen }

// Haversine distance in metres between two lat/lng points
function distanceM(lat1, lng1, lat2, lng2) {
  const R  = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a  = Math.sin(dLat/2) * Math.sin(dLat/2)
           + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180)
           * Math.sin(dLng/2) * Math.sin(dLng/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

// Broadcast alert to all clients within radiusM of origin, except the sender
function broadcastNearby({ originSessionId, lat, lng, radiusM = 500, payload }) {
  let sent = 0;
  clients.forEach((meta, ws) => {
    if (ws.readyState !== WebSocket.OPEN) return;
    if (meta.sessionId === originSessionId) return;
    if (!meta.lat || !meta.lng) return;
    const dist = distanceM(lat, lng, meta.lat, meta.lng);
    if (dist <= radiusM) {
      ws.send(JSON.stringify({ type: 'nearby_alert', dist: Math.round(dist), ...payload }));
      sent++;
    }
  });
  console.log(`[WS] broadcast sent to ${sent} nearby clients within ${radiusM}m`);
  return sent;
}

// Expose globally so routes/analyze.js can call it
global.broadcastNearby = broadcastNearby;

wss.on('connection', (ws) => {
  clients.set(ws, { sessionId: null, lat: null, lng: null, connectedAt: Date.now() });
  console.log(`[WS] client connected — total: ${clients.size}`);

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw);
      if (msg.type === 'register') {
        const meta = {
          sessionId   : msg.sessionId || null,
          lat         : typeof msg.lat === 'number' ? msg.lat : null,
          lng         : typeof msg.lng === 'number' ? msg.lng : null,
          connectedAt : Date.now(),
        };
        clients.set(ws, meta);
        // Cache last known position
        if (meta.sessionId && meta.lat && meta.lng) {
          lastKnown.set(meta.sessionId, { lat: meta.lat, lng: meta.lng, lastSeen: Date.now() });
        }
        console.log(`[WS] registered session=${msg.sessionId?.slice(0,8)} lat=${msg.lat} lng=${msg.lng}`);
        ws.send(JSON.stringify({ type: 'registered', ok: true, clients: clients.size }));
      }
      if (msg.type === 'location_update') {
        const meta = clients.get(ws) || {};
        clients.set(ws, { ...meta, lat: msg.lat, lng: msg.lng });
      }
    } catch(e) { /* ignore bad messages */ }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`[WS] client disconnected — total: ${clients.size}`);
  });

  ws.on('error', () => clients.delete(ws));
});

// Expose client count for health endpoint
global.wsClientCount = () => clients.size;
// ─────────────────────────────────────────────────────────────────────────────

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' }, contentSecurityPolicy: false }));

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',').map(o => o.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-ID'],
}));

app.use(express.json({ limit: '4mb' }));
app.use(express.urlencoded({ extended: false, limit: '4mb' }));
app.use(morgan('combined'));
app.use(globalRateLimiter);

const staticDir = path.join(__dirname, 'public');
app.use('/', express.static(staticDir));
app.use('/oceanwatch', express.static(staticDir));

app.get(['/admin', '/oceanwatch/admin'], (req, res) => {
  res.sendFile(path.join(staticDir, 'admin.html'));
});

if (process.env.CLIENT_SECRET) {
  app.use(['/api', '/oceanwatch/api'], validateApiKey);
}

app.use(['/api/health',  '/oceanwatch/api/health'],  healthRouter);
app.use(['/api/stats',   '/oceanwatch/api/stats'],   statsRouter);
app.use(['/api/analyze', '/oceanwatch/api/analyze'], analyzeRouter);

app.get(['/api/clients', '/oceanwatch/api/clients'], (req, res) => {
  const now = Date.now();
  const STALE_MS = 60000; // show positions up to 60s after disconnect

  // Live connected clients with GPS
  const live = [];
  clients.forEach((meta) => {
    if (meta.lat && meta.lng) {
      live.push({
        sessionId  : meta.sessionId ? meta.sessionId.slice(0, 12) : 'unknown',
        lat        : meta.lat,
        lng        : meta.lng,
        connectedAt: meta.connectedAt,
        status     : 'live',
      });
    }
  });

  // Add last-known positions for recently disconnected sessions (not already in live)
  const liveIds = new Set(live.map(c => c.sessionId));
  lastKnown.forEach((pos, sessionId) => {
    if (now - pos.lastSeen > STALE_MS) { lastKnown.delete(sessionId); return; }
    if (liveIds.has(sessionId.slice(0, 12))) return; // already showing as live
    live.push({
      sessionId  : sessionId.slice(0, 12),
      lat        : pos.lat,
      lng        : pos.lng,
      connectedAt: pos.lastSeen,
      status     : 'recent',
    });
  });

  res.json({ ok: true, total: clients.size, located: live.length, clients: live });
});

app.get(['/api/debug', '/oceanwatch/api/debug'], (req, res) => {
  res.json({
    hasKey      : !!(process.env.ANTHROPIC_API_KEY || global.ANTHROPIC_API_KEY),
    keyPrefix   : (process.env.ANTHROPIC_API_KEY || global.ANTHROPIC_API_KEY || '').slice(0, 16) || 'MISSING',
    nodeVersion : process.version,
    env         : process.env.NODE_ENV || 'not set',
    dirname     : __dirname,
    wsClients   : clients.size,
  });
});

app.get('/oceanwatch/test', (req, res) => {
  res.json({ alive: true, node: process.version, dir: __dirname });
});

app.use((req, res) => res.status(404).json({ error: 'Not found', path: req.path }));

app.use((err, req, res, _next) => {
  const status = err.status || 500;
  if (status >= 500) console.error('[ERROR]', err);
  res.status(status).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`\n✅  OceanWatch running on http://localhost:${PORT} — WebSocket on /ws\n`));

module.exports = app;
