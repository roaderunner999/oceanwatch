'use strict';

function validateApiKey(req, res, next) {
  const secret = process.env.CLIENT_SECRET;
  if (!secret) return next();   // no secret set — open access

  const auth = req.headers['authorization'] || '';
  const provided = auth.startsWith('Bearer ') ? auth.slice(7) : auth;

  if (provided !== secret) {
    return res.status(401).json({ ok: false, error: 'Unauthorized' });
  }
  next();
}

module.exports = { validateApiKey };
