'use strict';

const store = {
  stats: {
    totalScans     : 0,
    successScans   : 0,
    errorScans     : 0,
    alertsTriggered: 0,
    extremeScans   : 0,
    ripDetected    : 0,
    startedAt      : new Date().toISOString(),
  },
  scanHistory: [],
};

const MAX_HISTORY = 100;

store.addToHistory = function(entry) {
  store.scanHistory.unshift(entry);
  if (store.scanHistory.length > MAX_HISTORY) store.scanHistory.pop();
};

module.exports = store;
