const App = require('../../models/AppModel');
const config = require('../../config');
const { smembersAsync } = require('../redis/redisGetter');
const { saddAsync } = require('../redis/redisSetter');
const { WAIVIO_ADMINS } = require('../../constants/common');
const { tagCategoriesClient } = require('../redis/redis');

exports.getWaivioAdminsAndOwner = async (update = false) => {
  let waivioAdmins = await smembersAsync(WAIVIO_ADMINS, tagCategoriesClient);
  if (!waivioAdmins.length || update) {
    const { result, error } = await App.findOne({ host: config.waivio_auth.host },
      { admins: 1, owner: 1 });
    if (error) return [];

    waivioAdmins = [...result.admins, result.owner];
    await saddAsync({ key: WAIVIO_ADMINS, client: tagCategoriesClient, values: waivioAdmins });

    return waivioAdmins;
  }

  return waivioAdmins;
};
