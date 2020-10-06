const _ = require('lodash');
const Sentry = require('@sentry/node');
const moment = require('moment');
const { sendSentryNotification } = require('utilities/helpers/sentryHelper');
const { App, websitePayments } = require('models');
const { redisGetter } = require('utilities/redis');
const { sitesHelper } = require('utilities/helpers');
const objectBotRequests = require('utilities/requests/objectBotRequests');
const { OBJECT_BOT } = require('constants/requestData');
const { redisStatisticsKey, FEE, STATUSES } = require('constants/sitesConstants');

exports.dailyDebt = async () => {
  const { result: apps, error } = await App.find({ inherited: true });
  if (error) await sendError(error);
  for (const app of apps) {
    if (app.deactivatedAt && moment.utc(app.deactivatedAt).valueOf()
        < moment.utc().subtract(1, 'day').startOf('day').valueOf()) {
      continue;
    }

    const { result, error: paymentsError } = await websitePayments.find(
      { condition: { userName: app.owner }, sort: { createdAt: 1 } },
    );
    if (paymentsError) await sendError(paymentsError);

    /** Collect data for debt calculation */
    const { payable } = await sitesHelper.getPaymentsTable(result);
    const todayUsers = await redisGetter.getSiteActiveUser(`${redisStatisticsKey}:${app.host}`);
    const countUsers = _.get(todayUsers, 'length', 0);
    const invoice = countUsers * FEE.perUser < FEE.minimumValue
      ? FEE.minimumValue
      : _.round(countUsers * FEE.perUser, 3);

    if (payable < invoice) {
      await App.updateMany({ owner: app.owner, inherited: true }, { status: STATUSES.FROZEN });
    }

    const data = {
      invoice, userName: app.owner, countUsers, host: app.host,
    };
    const { error: createError } = await objectBotRequests.sendCustomJson(data,
      `${OBJECT_BOT.HOST}${OBJECT_BOT.BASE_URL}${OBJECT_BOT.SEND_INVOICE}`);
    if (createError) {
      Sentry.captureException(Object.assign(error, data));
      await sendSentryNotification();
    }
    await redisGetter.deleteSiteActiveUser(`${redisStatisticsKey}:${app.host}`);
  }
};

const sendError = async (error) => {
  Sentry.captureException(error);
  await sendSentryNotification(error);
};
