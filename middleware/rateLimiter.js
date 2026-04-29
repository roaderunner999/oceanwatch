'use strict';

const rateLimit = require('express-rate-limit');

// Global limiter — all routes
const globalRateLimiter = rateLimit({
  windowMs : 60 * 1000,   // 1 minute
  max      : 60,
  standardHeaders: true,
  legacyHeaders  : false,
  message  : { ok: false, error: 'Too many requests — please slow down.' },
});

// Per-IP daily scan cap (generous for beach-side monitoring)
const dailyScanLimit = rateLimit({
  windowMs : 24 * 60 * 60 * 1000,   // 24 hours
  max      : parseInt(process.env.DAILY_SCAN_LIMIT || '500'),
  standardHeaders: true,
  legacyHeaders  : false,
  keyGenerator   : (req) => req.ip,
  handler        : (req, res) => {
    res.status(429).json({ ok: false, error: 'Daily scan limit reached. Resets at midnight.' });
  },
});

module.exports = { globalRateLimiter, dailyScanLimit };
