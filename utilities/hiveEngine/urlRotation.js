const _ = require('lodash');
const { HIVE_ENGINE_NODES } = require('../../constants/hiveEngine');
const { mainFeedsCacheClient } = require('../redis/redis');

const CACHE_PREFIX = 'engine_url_stats:';
const CACHE_TTL = 1200; // 20 minutes in seconds
const WEIGHT_FACTORS = {
  ERROR_WEIGHT: 0.4,
  RESPONSE_TIME_WEIGHT: 0.3,
  REQUEST_COUNT_WEIGHT: 0.3,
};

class UrlRotationManager {
  constructor() {
    this.client = mainFeedsCacheClient;
  }

  async getUrlStats(url) {
    const key = `${CACHE_PREFIX}${url}`;
    const stats = await this.client.hgetall(key);

    if (_.isEmpty(stats)) {
      return {
        errors: 0,
        totalRequests: 0,
        totalResponseTime: 0,
        avgResponseTime: 0,
        avgErrors: 0,
        weight: 1.0,
      };
    }

    return {
      errors: parseInt(stats.errors, 10) || 0,
      totalRequests: parseInt(stats.totalRequests, 10) || 0,
      totalResponseTime: parseInt(stats.totalResponseTime, 10) || 0,
      avgResponseTime: parseFloat(stats.avgResponseTime) || 0,
      avgErrors: parseFloat(stats.avgErrors) || 0,
      weight: parseFloat(stats.weight) || 1.0,
    };
  }

  async updateUrlStats(url, responseTime, hasError) {
    const key = `${CACHE_PREFIX}${url}`;
    const pipeline = this.client.pipeline();

    const exists = await this.client.exists(key);

    // Increment counters
    pipeline.hincrby(key, 'totalRequests', 1);
    if (hasError) {
      pipeline.hincrby(key, 'errors', 1);
    }
    pipeline.hincrby(key, 'totalResponseTime', responseTime);

    if (!exists) {
      pipeline.expire(key, CACHE_TTL);
    }

    await pipeline.exec();

    // Update calculated fields
    await this.updateCalculatedStats(url);
  }

  async updateCalculatedStats(url) {
    const key = `${CACHE_PREFIX}${url}`;
    const stats = await this.getUrlStats(url);

    const avgResponseTime = stats.totalRequests > 0
      ? stats.totalResponseTime / stats.totalRequests
      : 0;

    const avgErrors = stats.totalRequests > 0
      ? stats.errors / stats.totalRequests
      : 0;

    const weight = this.calculateWeight(avgErrors, avgResponseTime, stats.totalRequests);

    const pipeline = this.client.pipeline();
    pipeline.hset(key, 'avgResponseTime', avgResponseTime);
    pipeline.hset(key, 'avgErrors', avgErrors);
    pipeline.hset(key, 'weight', weight);

    await pipeline.exec();
  }

  calculateWeight(avgErrors, avgResponseTime, totalRequests) {
    // Normalize factors (lower is better for errors and response time)
    const errorScore = Math.max(0, 1 - avgErrors);
    const responseTimeScore = Math.max(0, 1 - (avgResponseTime / 5000)); // Normalize to 5 seconds
    const requestCountScore = Math.max(0, 1 - (totalRequests / 100)); // Normalize to 100 requests

    return (
      errorScore * WEIGHT_FACTORS.ERROR_WEIGHT
      + responseTimeScore * WEIGHT_FACTORS.RESPONSE_TIME_WEIGHT
      + requestCountScore * WEIGHT_FACTORS.REQUEST_COUNT_WEIGHT
    );
  }

  async getBestUrl() {
    const allStats = await Promise.all(
      HIVE_ENGINE_NODES.map((url) => this.getUrlStats(url)),
    );

    const urlStats = _.zipWith(HIVE_ENGINE_NODES, allStats, (url, stats) => ({
      url,
      ...stats,
    }));

    // Sort by weight (highest first)
    const sortedUrls = _.orderBy(urlStats, ['weight'], ['desc']);

    // Find all URLs with the highest weight
    const maxWeight = sortedUrls[0].weight;
    const bestUrls = sortedUrls.filter((url) => url.weight === maxWeight);

    // If multiple URLs have the same highest weight, randomly select one
    if (bestUrls.length > 1) {
      return _.sample(bestUrls).url;
    }

    return sortedUrls[0].url;
  }

  async recordRequest(url, responseTime, hasError) {
    await this.updateUrlStats(url, responseTime, hasError);
  }
}

const urlRotationManager = new UrlRotationManager();

module.exports = {
  urlRotationManager,
};
