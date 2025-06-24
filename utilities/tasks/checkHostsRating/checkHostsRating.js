const mongoose = require('mongoose');
const { setTimeout } = require('timers/promises');
const redisClient = require('../../redis/redis');

const REDIS_KEY = 'posts_links_to_check_task';

const MAX_DOMAINS_PER_CALL = 100;
const MAX_API_CALLS_PER_HOUR = 10000;
const HOUR_IN_MS = 60 * 60 * 1000;

// Rate limiting state
let apiCallCount = 0;
let lastResetTime = Date.now();

const PageRankSchema = new mongoose.Schema({
  page_rank_integer: {
    type: Number,
    required: true,
  },
  page_rank_decimal: {
    type: Number,
    required: true,
  },
  rank: {
    type: String,
  },
  domain: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
}, {
  timestamps: false, versionKey: false,
});

PageRankSchema.index({ page_rank_decimal: -1 });

const resetRateLimit = () => {
  const now = Date.now();
  if (now - lastResetTime >= HOUR_IN_MS) {
    apiCallCount = 0;
    lastResetTime = now;
    console.log('Rate limit reset - new hour started');
  }
};

const checkRateLimit = () => {
  resetRateLimit();
  if (apiCallCount >= MAX_API_CALLS_PER_HOUR) {
    const waitTime = HOUR_IN_MS - (Date.now() - lastResetTime);
    console.log(`Rate limit reached (${MAX_API_CALLS_PER_HOUR} calls/hour). Waiting ${Math.ceil(waitTime / 1000)} seconds...`);
    return false;
  }
  return true;
};

const getPageRank = async (domains) => {
  if (!checkRateLimit()) {
    return { error: new Error('Rate limit exceeded') };
  }

  const apiKey = process.env.PAGE_RANK_KEY;
  if (!apiKey) throw new Error('PAGE_RANK_KEY not found');
  const params = new URLSearchParams();
  domains.forEach((domain) => params.append('domains[]', domain));

  const url = `https://openpagerank.com/api/v1.0/getPageRank?${params.toString()}`;

  try {
    apiCallCount++;
    console.log(`API call #${apiCallCount}/${MAX_API_CALLS_PER_HOUR} - Processing ${domains.length} domains`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'API-OPR': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return { result: result.response };
  } catch (error) {
    console.error('Error fetching PageRank:', error);
    return { error };
  }
};

const checkHostsRating = async () => {
  try {
    const connection = await mongoose.connect('mongodb://localhost:27017/page_rank');
    const PageRank = connection.model('PageRank', PageRankSchema);

    let totalProcessedDomains = 0;
    let totalApiCalls = 0;

    console.log('Starting PageRank processing...');

    while (true) {
      const domains = await redisClient.mainFeedsCacheClient.spop(REDIS_KEY, MAX_DOMAINS_PER_CALL);
      if (domains.length === 0) {
        console.log('No more domains to process');
        break;
      }

      const {
        result,
        error,
      } = await getPageRank(domains);

      if (error) {
        if (error.message === 'Rate limit exceeded') {
          // Wait for rate limit to reset
          const waitTime = HOUR_IN_MS - (Date.now() - lastResetTime);
          await setTimeout(waitTime);
          continue;
        }
        console.error('Fatal error, stopping processing:', error);
        break;
      }

      totalApiCalls++;
      const ranked = result.filter((el) => el.status_code === 200 && !el.error);
      totalProcessedDomains += domains.length;

      if (ranked.length > 0) {
        for (const rankedElement of ranked) {
          try {
            await PageRank.create(rankedElement);
          } catch (err) {
            console.log(err);
            continue;
          }
        }
        console.log(`Processed ${ranked.length} domains successfully. Total processed: ${totalProcessedDomains}, API calls: ${totalApiCalls}`);
      } else {
        console.log(`No valid results for ${domains.length} domains. Total processed: ${totalProcessedDomains}, API calls: ${totalApiCalls}`);
      }
    }

    console.log(`Processing complete. Total domains processed: ${totalProcessedDomains}, Total API calls: ${totalApiCalls}`);
  } catch (error) {
    console.error(error);
  }
};

module.exports = { checkHostsRating };
