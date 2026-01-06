const { Router } = require('express');
const eventLoopMonitor = require('../utilities/eventLoopMonitor');

const router = new Router();

/**
 * GET /healthz
 * Liveness probe - returns 200 if the process is alive and Express can respond.
 * Does NOT depend on ELD status.
 */
router.get('/healthz', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

/**
 * GET /readyz
 * Readiness probe - returns 200 if service is ready (ELD is OK).
 * Returns 503 if service is degraded (ELD in critical state for N consecutive windows).
 */
router.get('/readyz', (req, res) => {
  const health = eventLoopMonitor.getHealthStatus();
  const statusCode = health.healthy ? 200 : 503;

  res.status(statusCode).json({
    status: health.healthy ? 'ok' : 'degraded',
    ready: health.healthy,
    degraded: health.degraded,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    eventLoopDelay: {
      monitoring: eventLoopMonitor.isActive(),
      consecutiveCriticalWindows: health.consecutiveCriticalWindows,
      requiredCriticalWindows: health.requiredCriticalWindows,
      thresholds: health.thresholds,
      metrics: health.metrics ? {
        p50Ms: health.metrics.p50?.toFixed(2),
        p90Ms: health.metrics.p90?.toFixed(2),
        p99Ms: health.metrics.p99?.toFixed(2),
        maxMs: health.metrics.max?.toFixed(2),
        meanMs: health.metrics.mean?.toFixed(2),
        measuredAt: health.metrics.timestamp
          ? new Date(health.metrics.timestamp).toISOString()
          : null,
      } : null,
    },
  });
});

module.exports = router;
