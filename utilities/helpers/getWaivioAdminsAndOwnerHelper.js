const App = require('../../models/AppModel');
const config = require('../../config');
const { getAdminsByOwner } = require('../redis/redisGetter');
const { addAdminsByOwner } = require('../redis/redisSetter');

exports.getWaivioAdminsAndOwner = async () => {
  const waivioOwner = await App.findOne({ host: config.waivio_auth.host }, { owner: 1 });
  if (!waivioOwner) return { waivioOwner, waivioAdmins: [] };

  let waivioAdmins = await getAdminsByOwner(waivioOwner);
  if (!waivioAdmins.length) {

    waivioAdmins = await App.findOne({ owner: waivioOwner }, { admins: [] });
    console.log('waivioAdmins', waivioAdmins);
    // проверить точно ли мы получаем админов? и как?
  }

  if (!waivioAdmins.length) return { waivioOwner, waivioAdmins: [] };

  await addAdminsByOwner(waivioOwner, waivioAdmins);

  return { waivioOwner, waivioAdmins };
};
