const { App, Wobj } = require('models');
const _ = require('lodash');
const asyncLocalStorage = require('../../../middlewares/context/context');

/**
 * Return hashtags of specified app
 * List of hashtags saved in App.supported_hashtags
 * @param appName {String}
 * @param skip {number}
 * @param limit {number}
 * @returns {Promise<{error: any}|{appError: *}|{wobjects: any, hasMore: any}>}
 */
module.exports = async ({ name, skip, limit }) => {
  const store = asyncLocalStorage.getStore();
  const host = store.get('host');
  const { result: app, error: appError } = await App.findOne({ host });
  if (appError) return { appError };
  const { result: wObjectsData, error } = await Wobj.find(
    {
      author_permlink: { $in: _.get(app, 'supported_hashtags', []) },
      'status.title': { $nin: ['unavailable', 'relisted'] },
    },
    '',
    { weight: -1 },
    skip,
    limit + 1,
  );
  if (error) return { error };
  return {
    wobjects: wObjectsData.slice(0, limit),
    hasMore: wObjectsData.length > limit,
  };
};
