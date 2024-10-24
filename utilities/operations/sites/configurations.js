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
const { updateAiCustomStore } = require('../assistant/migration/customByApp');

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
  return { result: _.get(result, 'configuration', {}) };
};

const deleteConfigCache = async ({ host }) => {
  await redisSetter.deleteKey({
    key: `${REDIS_KEYS.API_RES_CACHE}:getConfigurationsList:${host}`,
    client: mainFeedsCacheClient,
  });
  await redisSetter.deleteKey({
    key: `${REDIS_KEYS.API_RES_CACHE}:aboutObjectFormat:${host}`,
    client: mainFeedsCacheClient,
  });
};

exports.saveConfigurations = async ({ host, userName, configuration }) => {
  const { result: app, error } = await App.findOne({ host, owner: userName, inherited: true });
  if (error) return { error };
  if (!app) return { error: { status: 404, message: 'App not found' } };

  const dbConfigKeys = _.get(app.configuration, 'configurationFields');
  const keysForUpdate = Object.keys(_.omit(configuration, ['configurationFields']));

  /** Validate configuration keys, for different sites - can be different keys */
  if (_.some(keysForUpdate, (el) => !_.includes(dbConfigKeys, el))) {
    return { error: { status: 422, message: `Configuration validation failed, not all keys allowed to update, valid keys - ${dbConfigKeys.join(', ')}` } };
  }

  /** Check wobject to exist */
  if (configuration?.aboutObject) {
    const { result } = await Wobj.findOne({ author_permlink: configuration.aboutObject });
    if (!result) return { error: { status: 422, message: 'Configuration validation failed, aboutObject not exist' } };
  }
  /** update assistant knowledge */
  if (configuration?.advancedAI) updateAiCustomStore({ userName, host });

  const { result: updatedApp, error: updateError } = await App.findOneAndUpdate({ _id: app._id }, {
    configuration: {
      ...app.configuration,
      ...configuration,
    },
  });
  if (updateError) return { error: updateError };
  await deleteConfigCache({ host: app.host });

  const result = await sitesHelper.aboutObjectFormat(updatedApp);
  return { result: _.get(result, 'configuration') };
};
