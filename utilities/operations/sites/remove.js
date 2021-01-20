const _ = require('lodash');
const { OBJECT_BOT } = require('constants/requestData');
const {
  STATUSES, redisStatisticsKey, FEE, CAN_DELETE_STATUSES,
} = require('constants/sitesConstants');
const { App } = require('models');
const objectBotRequests = require('utilities/requests/objectBotRequests');
const { redisGetter } = require('utilities/redis');
const manage = require('utilities/operations/sites/manage');
const Sentry = require('@sentry/node');
const { sendSentryNotification } = require('utilities/helpers/sentryHelper');

exports.deleteWebsite = async ({ host, userName }) => {
  const { result: app, error } = await App.findOne({
    host, owner: userName, inherited: true, status: { $in: CAN_DELETE_STATUSES },
  });
  if (error || !app) return { error: error || { status: 404, message: 'App not found' } };

  if (app.status === STATUSES.INACTIVE) {
    const { error: inactiveError } = await deleteInactiveWebsite(app);
    if (inactiveError) return { error: inactiveError };
  }

  const { result, error: createError } = await objectBotRequests.sendCustomJson({ host, userName },
    `${OBJECT_BOT.HOST}${OBJECT_BOT.BASE_URL}${OBJECT_BOT.DELETE_WEBSITE}`);
  if (createError) {
    return {
      error: { status: _.get(createError, 'response.status'), message: _.get(createError, 'response.statusText', 'Forbidden') },
    };
  }

  return { result };
};

const deleteInactiveWebsite = async (app) => {
  const todayUsers = await redisGetter.getSiteActiveUser(`${redisStatisticsKey}:${app.host}`);
  const countUsers = _.get(todayUsers, 'length', 0);
  const { accountBalance, error } = await manage.getManagePage({ userName: app.owner });
  if (error) return { error };
  const todayWriteOff = countUsers * FEE.perUser < FEE.minimumValue
    ? FEE.minimumValue
    : _.round(countUsers * FEE.perUser, 3);

  if (accountBalance.paid < todayWriteOff) return { error: { status: 402, message: 'insufficient funds on the balance sheet' } };
  const data = {
    amount: todayWriteOff, userName: app.owner, countUsers, host: app.host,
  };
  const { error: invoiceError } = await objectBotRequests.sendCustomJson(data,
    `${OBJECT_BOT.HOST}${OBJECT_BOT.BASE_URL}${OBJECT_BOT.SEND_INVOICE}`, false);
  if (invoiceError) {
    Sentry.captureException(error);
    await sendSentryNotification(error);
    return { error: invoiceError };
  }
  await redisGetter.deleteSiteActiveUser(`${redisStatisticsKey}:${app.host}`);
};
