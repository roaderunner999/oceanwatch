'use strict';

const express = require('express');
const router  = express.Router();

function formatUptime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

router.get('/', (req, res) => {
  res.json({
    ok     : true,
    service: 'OceanWatch',
    version: '1.0.0',
    uptime : formatUptime(process.uptime()),
    uptimeSeconds: Math.round(process.uptime()),
    memory : Math.round(process.memoryUsage().heapUsed / 1e6 * 10) / 10,
    time   : new Date().toISOString(),
  });
});

module.exports = router;

