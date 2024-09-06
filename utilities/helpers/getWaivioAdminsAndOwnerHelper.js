const _ = require('lodash');
const App = require('../../models/AppModel');
const config = require('../../config');
const { smembersAsync } = require('../redis/redisGetter');
const { saddAsync } = require('../redis/redisSetter');
const { WAIVIO_ADMINS } = require('../../constants/common');
const { tagCategoriesClient } = require('../redis/redis');

exports.getWaivioAdminsAndOwner = async (update = false) => {
  let waivioAdmins = await smembersAsync(WAIVIO_ADMINS, tagCategoriesClient);
  if (!waivioAdmins.length || update) {
    const { result, error } = await App.findOne(
      { host: config.appHost },
      { admins: 1, owner: 1 },
    );
    if (error) return [];

    waivioAdmins = _.compact([..._.get(result, 'admins', []), _.get(result, 'owner')]);
    if (waivioAdmins.length > 0) {
      await saddAsync({ key: WAIVIO_ADMINS, client: tagCategoriesClient, values: waivioAdmins });
    }

    return waivioAdmins;
  }

  return waivioAdmins;
};
