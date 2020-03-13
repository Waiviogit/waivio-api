const { App, Wobj } = require('models');
const _ = require('lodash');

/**
 * Return hashtags of specified app
 * List of hashtags saved in App.supported_hashtags
 * @param appName {String}
 * @param skip {number}
 * @param limit {number}
 * @returns {Promise<{error: any}|{appError: *}|{wobjects: any, hasMore: any}>}
 */
module.exports = async ({ name, skip, limit }) => {
  const { app, error: appError } = await App.getOne({ name });
  if (appError) return { appError };
  const { wObjectsData, hasMore, error } = await Wobj.getAll({
    author_permlinks: _.get(app, 'supported_hashtags', []),
    skip,
    limit,
  });
  if (error) return { error };
  return { wobjects: wObjectsData, hasMore };
};
