const App = require('../../models/AppModel');
const config = require('../../config');
const { getAdminsByOwner } = require('../redis/redisGetter');
const { addAdminsByOwner } = require('../redis/redisSetter');

exports.getWaivioAdminsAndOwner = async (update = false) => {
  const { result } = await App.findOne({ host: config.waivio_auth.host }, { owner: 1 });
  if (!result) return { waivioOwner: '', waivioAdmins: [] };

  let waivioAdmins = await getAdminsByOwner(result.owner);
  if (!waivioAdmins.length || update) {
    const adminsResult = await App.findOne({ owner: result.owner }, { admins: 1 });
    waivioAdmins = adminsResult.result.admins;
  }

  if (!waivioAdmins.length) return { waivioOwner: result.owner, waivioAdmins: [] };

  await addAdminsByOwner(result.owner, waivioAdmins);

  return { waivioOwner: result.owner, waivioAdmins };
};
