const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Simple in-memory rate limiter to prevent overwhelming external APIs
 */
class SimpleRateLimiter {
  constructor(maxRequestsPerMinute = 60) {
    this.maxRequests = maxRequestsPerMinute;
    this.requests = [];
  }

  /**
   * Wait for an available slot before making a request
   * @returns {Promise<void>}
   */
  async waitForSlot() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Remove requests older than 1 minute
    this.requests = this.requests.filter((time) => time > oneMinuteAgo);

    if (this.requests.length >= this.maxRequests) {
      // Calculate how long to wait
      const oldestRequest = Math.min(...this.requests);
      const waitTime = oldestRequest + 60000 - now;

      if (waitTime > 0) {
        console.log(`Rate limit reached, waiting ${waitTime}ms before next request`);
        await delay(waitTime);
        return this.waitForSlot(); // Recursive call after waiting
      }
    }

    this.requests.push(now);
  }

  /**
   * Get current request count in the last minute
   * @returns {number}
   */
  getCurrentRequestCount() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    this.requests = this.requests.filter((time) => time > oneMinuteAgo);
    return this.requests.length;
  }

  /**
   * Reset the rate limiter
   */
  reset() {
    this.requests = [];
  }
}

/**
 * Process items sequentially with rate limiting and retry logic
 * @param {Array} items - Items to process
 * @param {Function} processingFunction - Function to process each item
 * @param {Object} options - Configuration options
 * @returns {Promise<Array>} Results array with status and value/reason
 */
async function processWithRateLimit(items, processingFunction, options = {}) {
  const {
    delayMs = 100,
    maxRetries = 2,
    rateLimiter = null,
    onProgress = null,
  } = options;

  const results = [];
  let consecutiveErrors = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    let retryCount = 0;
    let success = false;

    while (!success && retryCount <= maxRetries) {
      try {
        if (onProgress) {
          onProgress(i + 1, items.length, item, retryCount);
        }

        // Wait for rate limiter if provided
        if (rateLimiter) {
          await rateLimiter.waitForSlot();
        }

        const result = await processingFunction(item);
        results.push({ status: 'fulfilled', value: result });
        success = true;
        consecutiveErrors = 0; // Reset error counter on success
      } catch (error) {
        retryCount++;
        consecutiveErrors++;

        console.error(`Error processing item (attempt ${retryCount}):`, error.message);

        // If it's a rate limit error (503, 429) or too many consecutive errors, increase delay
        if (error.status === 503 || error.status === 429 || consecutiveErrors >= 3) {
          const backoffDelay = Math.min(delayMs * 2 ** retryCount, 5000); // Exponential backoff, max 5s
          console.log(`Rate limit detected, backing off for ${backoffDelay}ms`);
          await delay(backoffDelay);
        }

        if (retryCount > maxRetries) {
          results.push({ status: 'rejected', reason: error });
          success = true; // Exit retry loop
        } else {
          await delay(delayMs * retryCount); // Progressive delay for retries
        }
      }
    }

    // Add delay between items, increased if we've had recent errors
    if (i < items.length - 1) {
      const adaptiveDelay = consecutiveErrors > 0 ? delayMs * (1 + consecutiveErrors) : delayMs;
      await delay(adaptiveDelay);
    }
  }

  return results;
}

/**
 * Create a rate limiter instance with environment variable configuration
 * @param {string} envPrefix - Environment variable prefix (e.g., 'HIVE_API')
 * @param {number} defaultRequestsPerMinute - Default requests per minute
 * @returns {SimpleRateLimiter}
 */
function createConfigurableRateLimiter(envPrefix, defaultRequestsPerMinute = 30) {
  const requestsPerMinute = parseInt(process.env[`${envPrefix}_REQUESTS_PER_MINUTE`]) || defaultRequestsPerMinute;
  return new SimpleRateLimiter(requestsPerMinute);
}

module.exports = {
  SimpleRateLimiter,
  processWithRateLimit,
  createConfigurableRateLimiter,
  delay,
};
