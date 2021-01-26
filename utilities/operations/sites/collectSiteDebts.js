const _ = require('lodash');
const Sentry = require('@sentry/node');
const { sendSentryNotification } = require('utilities/helpers/sentryHelper');
const { App } = require('models');
const { redisGetter } = require('utilities/redis');
const objectBotRequests = require('utilities/requests/objectBotRequests');
const { OBJECT_BOT } = require('constants/requestData');
const {
  redisStatisticsKey, FEE, STATUSES, TEST_DOMAINS,
} = require('constants/sitesConstants');

exports.dailyDebt = async (timeout = 200) => {
  const { result: apps, error } = await App.find({
    inherited: true,
    status: { $in: [STATUSES.INACTIVE, STATUSES.PENDING, STATUSES.ACTIVE] },
  });
  if (error) return sendError(error);
  for (const app of apps) {
    if (!await this.checkForTestSites(app.parent)) continue;

    /** Collect data for debt calculation */
    const todayUsers = await redisGetter.getSiteActiveUser(`${redisStatisticsKey}:${app.host}`);
    const countUsers = _.get(todayUsers, 'length', 0);
    const invoice = countUsers * FEE.perUser < FEE.minimumValue
      ? FEE.minimumValue
      : _.round(countUsers * FEE.perUser, 3);

    const data = {
      amount: invoice, userName: app.owner, countUsers, host: app.host,
    };
    const { error: createError } = await objectBotRequests.sendCustomJson(data,
      `${OBJECT_BOT.HOST}${OBJECT_BOT.BASE_URL}${OBJECT_BOT.SEND_INVOICE}`, false);
    if (createError) {
      console.error(`Request for create invoice for host ${data.host} 
      with amount ${data.amount}, daily users: ${data.countUsers} failed!`);
      await sendError(Object.assign(createError, data));
      continue;
    }

    await redisGetter.deleteSiteActiveUser(`${redisStatisticsKey}:${app.host}`);
    await new Promise((resolve) => setTimeout(resolve, timeout));
  }
};

const sendError = async (error) => {
  Sentry.captureException(error);
  await sendSentryNotification(error);
};

exports.checkForTestSites = async (parent) => {
  const { result, error } = await App.findOne({ _id: parent });
  if (error) {
    await sendError(error);
    return false;
  }
  if (process.env.NODE_ENV === 'staging' && _.includes(TEST_DOMAINS, result.host)) return true;
  return process.env.NODE_ENV === 'production' && !_.includes(TEST_DOMAINS, result.host);
};
