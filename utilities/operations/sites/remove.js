const _ = require('lodash');
const { OBJECT_BOT } = require('../../../constants/requestData');
const {
  STATUSES, redisStatisticsKey, CAN_DELETE_STATUSES,
} = require('../../../constants/sitesConstants');
const { App, AppAffiliate } = require('../../../models');
const objectBotRequests = require('../../requests/objectBotRequests');
const { redisGetter } = require('../../redis');
const { WAIVIO_ADMINS_ENV } = require('../../../constants/common');

const getAppToDelete = async ({ host, userName }) => {
  if (WAIVIO_ADMINS_ENV.includes(userName)) {
    const { result } = await App.findOne({
      host,
      inherited: true,
      status: { $in: CAN_DELETE_STATUSES },
    });
    return result;
  }

  const { result } = await App.findOne({
    host, owner: userName, inherited: true, status: { $in: CAN_DELETE_STATUSES },
  });
  return result;
};

exports.deleteWebsite = async ({ host, userName }) => {
  const app = await getAppToDelete({ host, userName });
  if (!app) return { status: 404, message: 'App not found' };

  const { result, error: createError } = await objectBotRequests.sendCustomJson(
    { host, userName: app.owner },
    `${OBJECT_BOT.HOST}${OBJECT_BOT.BASE_URL}${OBJECT_BOT.DELETE_WEBSITE}`,
  );
  if (createError) {
    return {
      error: { status: _.get(createError, 'response.status'), message: _.get(createError, 'response.statusText', 'Forbidden') },
    };
  }
  if (app.status === STATUSES.INACTIVE) {
    await redisGetter.deleteSiteActiveUser(`${redisStatisticsKey}:${app.host}`);
  }
  await AppAffiliate.deleteMany({ filter: { host } });
  return { result };
};
