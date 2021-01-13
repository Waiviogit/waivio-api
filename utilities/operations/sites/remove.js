const _ = require('lodash');
const { OBJECT_BOT } = require('constants/requestData');
const { STATUSES } = require('constants/sitesConstants');
const { App } = require('models');
const objectBotRequests = require('utilities/requests/objectBotRequests');
const { redisGetter } = require('utilities/redis');

exports.deleteWebsite = async ({ host, userName }) => {
  const { result: app, error } = await App.findOne({
    host, owner: userName, inherited: true, status: STATUSES.PENDING,
  });
  if (error || !app) return { error: error || { status: 404, message: 'App not found' } };

  const { result, error: createError } = await objectBotRequests.sendCustomJson({ host, userName },
    `${OBJECT_BOT.HOST}${OBJECT_BOT.BASE_URL}${OBJECT_BOT.DELETE_WEBSITE}`);
  if (createError) {
    return {
      error: { status: _.get(createError, 'response.status'), message: _.get(createError, 'response.statusText', 'Forbidden') },
    };
  }
  return { result };
};

// const deleteAcivatedWebsite = async (app) => {
//   const todayUsers = await redisGetter.getSiteActiveUser(`${redisStatisticsKey}:${app.host}`);
// }
