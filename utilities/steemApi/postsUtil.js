const _ = require('lodash');
const axios = require('axios');
const { client } = require('utilities/steemApi/steem');

exports.getPostsByCategory = async (data) => {
  try {
    if (!['trending', 'created', 'hot', 'blog', 'feed', 'promoted'].includes(data.category)) {
      return { error: { status: 422, message: 'Not valid category, expected: trending, created, hot, blog, feed, promoted!' } };
    }
    const posts = await client.database.getDiscussions(data.category, {
      limit: data.limit || 20,
      tag: data.tag,
      start_author: data.start_author,
      start_permlink: data.start_permlink,
    });

    return { posts };
  } catch (error) {
    return { error };
  }
};

/**
 * Return post or comment from steem blockchain if it exist and not deleted
 * @param author
 * @param permlink
 * @returns {Promise<{error: {message: string, status: number}}|{post: ({author}|any)}>}
 */
exports.getPost = async (author, permlink) => {
  const post = await client.database.call('get_content', [author, permlink]);

  if (post.author) {
    return { post };
  }
  return { error: { message: 'Post not found!', status: 404 } };
};

exports.getManyPosts = async (links = []) => {
  const posts = await Promise.all(links.map(async (link) => {
    const { post, error } = await this.getPost(_.get(link, 'author'), _.get(link, 'permlink'));

    if (post && !error) return post;
  }));

  return { posts: _.compact(posts) };
};


/**
 * Get comments authored by specified STEEM user
 * @param start_author {String} Specified STEEM user
 * @param start_permlink {String} permlink of last received comment(pagination)
 * @param limit {Number} count of comments to return
 * @returns {Promise<{comments: [Object]}|{error: {message: string, status: number}}>}
 */
// eslint-disable-next-line camelcase
exports.getUserComments = async ({ start_author, start_permlink, limit }) => {
  const comments = await client.database.call(
    'get_discussions_by_comments',
    [{ start_author, start_permlink, limit }],
  );

  return { comments };
};

/**
 * Get state of post(comment). State include a lot info, e.x. replies, users etc.
 * @param author {String}
 * @param permlink {String}
 * @param category {String} aka parent_permlink
 * @returns {Promise<{error: Object}|{result: Object}>}
 */
exports.getPostState = async ({ author, permlink, category }) => {
  const result = await client.database.call(
    'get_state',
    [`${category}/@${author}/${permlink}`],
  );
  if (!result || result.error) return { error: { message: _.get(result, 'error') } };

  const { result: content, error } = await getComments(author, permlink);
  if (error || !content) return { error: { message: _.get(error, 'message') } };

  result.content = content;
  return { result };
};

const getComments = async (author, permlink) => {
  try {
    const result = await axios.post('https://api.hive.blog', {
      id: 1,
      jsonrpc: '2.0',
      method: 'bridge.get_discussion',
      params: { author, permlink },
    });
    return { result: result.data.result };
  } catch (error) {
    return { error };
  }
};
