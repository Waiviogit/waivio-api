const { monitorEventLoopDelay } = require('node:perf_hooks');

// Configuration - can be overridden via environment variables
const CONFIG = {
  // Histogram resolution in nanoseconds (20ms default)
  resolution: parseInt(process.env.ELD_RESOLUTION_MS, 10) || 20,
  // Window size in milliseconds for aggregating metrics
  windowMs: parseInt(process.env.ELD_WINDOW_MS, 10) || 10000,
  // Thresholds in milliseconds
  warnThresholdMs: parseInt(process.env.ELD_WARN_THRESHOLD_MS, 10) || 100,
  criticalThresholdMs: parseInt(process.env.ELD_CRITICAL_THRESHOLD_MS, 10) || 500,
  // Number of consecutive critical windows before marking as degraded
  criticalWindowCount: parseInt(process.env.ELD_CRITICAL_WINDOW_COUNT, 10) || 3,
  // Log cooldown in milliseconds (to prevent log spam)
  logCooldownMs: parseInt(process.env.ELD_LOG_COOLDOWN_MS, 10) || 60000,
  // Enable auto-exit on sustained critical ELD (for container restart)
  autoExitOnCritical: process.env.ELD_AUTO_EXIT !== 'false',
  // Additional windows to wait after degraded before exit (grace period)
  exitGraceWindows: parseInt(process.env.ELD_EXIT_GRACE_WINDOWS, 10) || 2,
};

// State
let histogram = null;
let windowInterval = null;
let consecutiveCriticalWindows = 0;
let isDegraded = false;
let lastLogTime = 0;
let currentMetrics = null;
let windowsAfterDegraded = 0;
let exitScheduled = false;

/**
 * Convert nanoseconds to milliseconds
 */
const nsToMs = (ns) => ns / 1e6;

/**
 * Get current ELD metrics from histogram
 */
const getMetrics = () => {
  if (!histogram) {
    return null;
  }

  return {
    min: nsToMs(histogram.min),
    max: nsToMs(histogram.max),
    mean: nsToMs(histogram.mean),
    stddev: nsToMs(histogram.stddev),
    p50: nsToMs(histogram.percentile(50)),
    p90: nsToMs(histogram.percentile(90)),
    p99: nsToMs(histogram.percentile(99)),
    exceeds: histogram.exceeds,
  };
};

/**
 * Log ELD metrics with cooldown protection
 */
const logMetrics = (level, message, metrics) => {
  const now = Date.now();
  if (now - lastLogTime < CONFIG.logCooldownMs) {
    return;
  }
  lastLogTime = now;

  const logData = {
    message,
    metrics: {
      p50: `${metrics.p50.toFixed(2)}ms`,
      p90: `${metrics.p90.toFixed(2)}ms`,
      p99: `${metrics.p99.toFixed(2)}ms`,
      max: `${metrics.max.toFixed(2)}ms`,
      mean: `${metrics.mean.toFixed(2)}ms`,
    },
    thresholds: {
      warn: `${CONFIG.warnThresholdMs}ms`,
      critical: `${CONFIG.criticalThresholdMs}ms`,
    },
    state: {
      consecutiveCriticalWindows,
      isDegraded,
    },
  };

  if (level === 'warn') {
    console.warn('[ELD Monitor]', JSON.stringify(logData));
  } else if (level === 'error') {
    console.error('[ELD Monitor]', JSON.stringify(logData));
  }
};

/**
 * Schedule graceful exit
 */
const scheduleExit = () => {
  if (exitScheduled) return;
  exitScheduled = true;

  console.error('[ELD Monitor] Initiating graceful shutdown due to sustained critical ELD');

  // Give some time for in-flight requests to complete
  setTimeout(() => {
    console.error('[ELD Monitor] Exiting process (exit code 1) for container restart');
    process.exit(1);
  }, 5000);
};

/**
 * Process metrics window - called every windowMs
 */
const processWindow = () => {
  const metrics = getMetrics();
  if (!metrics) return;

  currentMetrics = { ...metrics, timestamp: Date.now() };

  const { p99 } = metrics;

  // Check critical threshold
  if (p99 >= CONFIG.criticalThresholdMs) {
    consecutiveCriticalWindows++;
    logMetrics('error', 'Event loop delay CRITICAL', metrics);

    // Mark as degraded after N consecutive critical windows
    if (consecutiveCriticalWindows >= CONFIG.criticalWindowCount && !isDegraded) {
      isDegraded = true;
      windowsAfterDegraded = 0;
      console.error('[ELD Monitor] Service marked as DEGRADED after', consecutiveCriticalWindows, 'consecutive critical windows');
    }

    // If degraded, count windows and potentially trigger exit
    if (isDegraded) {
      windowsAfterDegraded++;
      if (CONFIG.autoExitOnCritical && windowsAfterDegraded >= CONFIG.exitGraceWindows) {
        scheduleExit();
      }
    }
  } else if (p99 >= CONFIG.warnThresholdMs) {
    // Warning level - reset critical counter but log
    consecutiveCriticalWindows = 0;
    windowsAfterDegraded = 0;
    logMetrics('warn', 'Event loop delay elevated', metrics);

    // Recover from degraded state if metrics improve
    if (isDegraded) {
      isDegraded = false;
      console.info('[ELD Monitor] Service recovered from degraded state');
    }
  } else {
    // Normal - reset counters
    if (consecutiveCriticalWindows > 0 || isDegraded) {
      console.info('[ELD Monitor] Event loop delay returned to normal');
    }
    consecutiveCriticalWindows = 0;
    windowsAfterDegraded = 0;
    if (isDegraded) {
      isDegraded = false;
      console.info('[ELD Monitor] Service recovered from degraded state');
    }
  }

  // Reset histogram for next window
  histogram.reset();
};

/**
 * Start ELD monitoring
 */
const start = () => {
  if (histogram) {
    console.warn('[ELD Monitor] Already running');
    return;
  }

  histogram = monitorEventLoopDelay({ resolution: CONFIG.resolution });
  histogram.enable();

  windowInterval = setInterval(processWindow, CONFIG.windowMs);
  // Prevent the interval from keeping the process alive
  windowInterval.unref();

  console.info('[ELD Monitor] Started with config:', {
    resolution: `${CONFIG.resolution}ms`,
    window: `${CONFIG.windowMs}ms`,
    warnThreshold: `${CONFIG.warnThresholdMs}ms`,
    criticalThreshold: `${CONFIG.criticalThresholdMs}ms`,
    criticalWindowCount: CONFIG.criticalWindowCount,
    logCooldown: `${CONFIG.logCooldownMs}ms`,
    autoExitOnCritical: CONFIG.autoExitOnCritical,
    exitGraceWindows: CONFIG.exitGraceWindows,
  });
};

/**
 * Stop ELD monitoring
 */
const stop = () => {
  if (windowInterval) {
    clearInterval(windowInterval);
    windowInterval = null;
  }
  if (histogram) {
    histogram.disable();
    histogram = null;
  }
  consecutiveCriticalWindows = 0;
  isDegraded = false;
  currentMetrics = null;
  windowsAfterDegraded = 0;
  exitScheduled = false;
  console.info('[ELD Monitor] Stopped');
};

/**
 * Get current health status
 * @returns {{ healthy: boolean, degraded: boolean, metrics: object|null, config: object }}
 */
const getHealthStatus = () => ({
  healthy: !isDegraded,
  degraded: isDegraded,
  consecutiveCriticalWindows,
  requiredCriticalWindows: CONFIG.criticalWindowCount,
  metrics: currentMetrics,
  thresholds: {
    warnMs: CONFIG.warnThresholdMs,
    criticalMs: CONFIG.criticalThresholdMs,
  },
});

/**
 * Check if service is ready (not degraded)
 */
const isReady = () => !isDegraded;

/**
 * Check if monitoring is active
 */
const isActive = () => histogram !== null;

module.exports = {
  start,
  stop,
  getHealthStatus,
  getMetrics,
  isReady,
  isActive,
  CONFIG,
};
