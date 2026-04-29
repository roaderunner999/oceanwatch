'use strict';

const express = require('express');
const router  = express.Router();
const store   = require('./store');

router.get('/', (req, res) => {
  res.json({
    ok     : true,
    stats  : store.stats,
    history: store.scanHistory,
  });
});

module.exports = router;
