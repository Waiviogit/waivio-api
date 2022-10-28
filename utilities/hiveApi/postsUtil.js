const { postClient } = require('utilities/hiveApi/hiveClient');
const _ = require('lodash');

exports.getPostsByCategory = async (data) => {
  try {
    if (!['trending', 'created', 'hot', 'blog', 'feed', 'promoted'].includes(data.category)) {
      return { error: { status: 422, message: 'Not valid category, expected: trending, created, hot, blog, feed, promoted!' } };
    }
    const posts = await postClient.database.getDiscussions(data.category, {
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
 * @param client {object}
 * @param author
 * @param permlink
 * @returns {Promise<{error: {message: string, status: number}}|{post: ({author}|any)}>}
 */
exports.getPost = async ({ author, permlink }) => {
  try {
    const post = await postClient.database.call('get_content', [author, permlink]);

    if (post.author) {
      return { post };
    }
    return { error: { message: 'Post not found!', status: 404 } };
  } catch (e) {
    return { error: { message: 'Post not found!', status: 404 } };
  }
};

exports.getManyPosts = async (links = []) => {
  const posts = await Promise.all(links.map(async (link) => {
    const { post, error } = await this.getPost(
      { author: _.get(link, 'author'), permlink: _.get(link, 'permlink') },
    );

    if (post && !error) return post;
  }));

  return { posts: _.compact(posts) };
};

/**
 * Get comments authored by specified STEEM user
 * @param client {object}
 * @param start_author {String} Specified STEEM user
 * @param start_permlink {String} permlink of last received comment(pagination)
 * @param limit {Number} count of comments to return
 * @returns {Promise<{comments: [Object]}|{error: {message: string, status: number}}>}
 */
// eslint-disable-next-line camelcase
exports.getUserComments = async ({ start_author, start_permlink, limit }) => {
  try {
    const comments = await postClient.database.call(
      'get_discussions_by_comments',
      [{ start_author, start_permlink, limit }],
    );

    return { comments };
  } catch (error) {
    return { error };
  }
};

exports.getCommentsArr = async (permlinks) => {
  try {
    const comments = await postClient.call(
      'database_api',
      'find_comments',
      { comments: permlinks },
    );

    if (!comments) return { comments: [] };

    return comments;
  } catch (error) {
    return { error };
  }
};

/**
 * Get state of post(comment). State include a lot info, e.x. replies, users etc.
 * @returns {Promise<{error: Object}|{result: Object}>}
 */
exports.getPostState = async ({ author, permlink, category }) => {
  try {
    const result = await postClient.database.call(
      'get_state',
      [`${category}/@${author}/${permlink}`],
    );
    if (!result || result.error) return { error: { message: _.get(result, 'error') } };

    return { result };
  } catch (error) {
    return { error: { message: error.message } };
  }
};

exports.getContent = async ({ author, permlink }) => {
  try {
    const result = await postClient.database.call(
      'get_content',
      [author, permlink],
    );
    if (!result || result.error) return { error: { message: _.get(result, 'error') } };

    return { result };
  } catch (error) {
    return { error: { message: error.message } };
  }
};
