const { Post } = require('../../../database').models;
const redisSetter = require('../../redis/redisSetter');
const redisClient = require('../../redis/redis');

const BATCH_SIZE = 1000;

const REDIS_KEY = 'posts_links_to_check_task';

const extractLinksFromText = (text) => {
  // More precise regex that handles URL boundaries better
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;
  const links = text.match(urlRegex) || [];

  // Clean up links by removing trailing punctuation
  return links.map((link) => link.replace(/[.,;:!?)\]}>"']+$/, ''));
};

const getHostFromUrl = (url) => {
  try {
    // Clean the URL first
    let cleanUrl = url.trim();

    // Remove any trailing punctuation that might have slipped through
    cleanUrl = cleanUrl.replace(/[.,;:!?)\]}>"']+$/, '');

    const urlObj = new URL(cleanUrl);
    return urlObj.hostname;
  } catch (error) {
    console.log(`Failed to parse URL: ${url}`, error.message);
    return null;
  }
};

const getLinksFromPosts = async () => {
  let lastId = null;
  let processed = 0;

  while (true) {
    const query = lastId ? { _id: { $gt: lastId } } : {};
    const posts = await Post.find(query, { body: 1, _id: 1 })
      .limit(BATCH_SIZE)
      .sort({ _id: 1 }).lean();

    if (posts.length === 0) break;

    for (const post of posts) {
      if (post.body) {
        const links = extractLinksFromText(post.body);
        const hosts = links.map(getHostFromUrl).filter((host) => host !== null);
        if (hosts.length > 0) {
          await redisSetter.saddAsync({
            key: REDIS_KEY,
            values: hosts,
            client: redisClient.mainFeedsCacheClient,
          });
        }
      }
      lastId = post._id;
    }

    processed += posts.length;
    console.log(`Processed ${processed} posts`);
  }
};

module.exports = { getLinksFromPosts };
