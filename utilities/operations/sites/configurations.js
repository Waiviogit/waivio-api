const _ = require('lodash');
const { App, Wobj } = require('models');
const { sitesHelper } = require('utilities/helpers');
const redisSetter = require('utilities/redis/redisSetter');
const { mainFeedsCacheClient } = require('utilities/redis/redis');
const {
  getCachedData,
  setCachedData,
} = require('../../helpers/cacheHelper');
const jsonHelper = require('../../helpers/jsonHelper');
const { TTL_TIME, REDIS_KEYS } = require('../../../constants/common');

/** For different types of sites, different configurations will be available,
 * in this method we send to the front a list of allowed configurations for this site */
exports.getConfigurationsList = async (host) => {
  const key = `${REDIS_KEYS.API_RES_CACHE}:getConfigurationsList:${host}`;
  const cache = await getCachedData(key);
  if (cache) {
    return jsonHelper.parseJson(cache, { result: '' });
  }

  let { result } = await App.findOne({ host });
  if (!result) return { error: { status: 404, message: 'App not Found!' } };
  result = await sitesHelper.aboutObjectFormat(result);

  await setCachedData({
    key, data: { result: _.get(result, 'configuration') }, ttl: TTL_TIME.ONE_MINUTE,
  });
  return { result: _.get(result, 'configuration') };
};

exports.saveConfigurations = async (params) => {
  const { result: app, error } = await App.findOne(
    { host: params.host, owner: params.userName, inherited: true },
  );
  if (error) return { error };
  if (!app) return { error: { status: 404, message: 'App not found' } };

  const dbConfigKeys = _.get(app.configuration, 'configurationFields');
  const keysForUpdate = Object.keys(_.omit(params.configuration, ['configurationFields']));

  /** Validate configuration keys, for different sites - can be different keys */
  if (_.some(keysForUpdate, (el) => !_.includes(dbConfigKeys, el))) {
    return { error: { status: 422, message: `Configuration validation failed, not all keys allowed to update, valid keys - ${dbConfigKeys.join(', ')}` } };
  }

  /** Check wobject to exist */
  if (_.get(params, 'configuration.aboutObject')) {
    const { result } = await Wobj.findOne({ author_permlink: params.configuration.aboutObject });
    if (!result) return { error: { status: 422, message: 'Configuration validation failed, aboutObject not exist' } };
  }

  const { result: updatedApp, error: updateError } = await App.findOneAndUpdate({ _id: app._id }, {
    configuration: {
      ...app.configuration,
      ...params.configuration,
    },
  });
  if (updateError) return { error: updateError };

  await redisSetter.deleteKey({
    key: `${REDIS_KEYS.API_RES_CACHE}:getConfigurationsList:${app.host}`,
    client: mainFeedsCacheClient,
  });
  await redisSetter.deleteKey({
    key: `${REDIS_KEYS.API_RES_CACHE}:aboutObjectFormat:${app.host}`,
    client: mainFeedsCacheClient,
  });

  const result = await sitesHelper.aboutObjectFormat(updatedApp);
  return { result: _.get(result, 'configuration') };
};
