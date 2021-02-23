const _ = require('lodash');
const { OBJECT_BOT } = require('constants/requestData');
const {
  STATUSES, redisStatisticsKey, CAN_DELETE_STATUSES,
} = require('constants/sitesConstants');
const { App } = require('models');
const objectBotRequests = require('utilities/requests/objectBotRequests');
const { redisGetter } = require('utilities/redis');

exports.deleteWebsite = async ({ host, userName }) => {
  const { result: app, error } = await App.findOne({
    host, owner: userName, inherited: true, status: { $in: CAN_DELETE_STATUSES },
  });
  if (error || !app) return { error: error || { status: 404, message: 'App not found' } };

  const { result, error: createError } = await objectBotRequests.sendCustomJson({ host, userName },
    `${OBJECT_BOT.HOST}${OBJECT_BOT.BASE_URL}${OBJECT_BOT.DELETE_WEBSITE}`);
  if (createError) {
    return {
      error: { status: _.get(createError, 'response.status'), message: _.get(createError, 'response.statusText', 'Forbidden') },
    };
  }
  if (app.status === STATUSES.INACTIVE) {
    await redisGetter.deleteSiteActiveUser(`${redisStatisticsKey}:${app.host}`);
  }

  return { result };
};
