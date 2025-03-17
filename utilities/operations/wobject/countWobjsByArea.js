const { Wobj } = require('../../../models');
const searchHelper = require('../../helpers/searchHelper');

module.exports = async ({
  objectType,
}) => {
  const appInfo = await searchHelper.getAppInfo({});
  const { result, error } = await Wobj.countWobjectsByArea({
    objectType, ...appInfo,
  });
  if (error || !result) return { error };
  return { wobjects: result };
};
