const _ = require('lodash');
const Sentry = require('@sentry/node');
const moment = require('moment');
const { sendSentryNotification } = require('utilities/helpers/sentryHelper');
const { App, websitePayments, websiteRefunds } = require('models');
const { redisGetter } = require('utilities/redis');
const { sitesHelper } = require('utilities/helpers');
const objectBotRequests = require('utilities/requests/objectBotRequests');
const { OBJECT_BOT } = require('constants/requestData');
const {
  redisStatisticsKey, FEE, STATUSES, REFUND_STATUSES, REFUND_TYPES,
} = require('constants/sitesConstants');

exports.dailyDebt = async (timeout = 200) => {
  const { result: apps, error } = await App.find({
    inherited: true,
    status: { $in: [STATUSES.INACTIVE, STATUSES.PENDING, STATUSES.ACTIVE] },
  });
  if (error) return sendError(error);
  for (const app of apps) {
    if (app.deactivatedAt && moment.utc(app.deactivatedAt).valueOf()
        < moment.utc().subtract(1, 'day').startOf('day').valueOf()) {
      await redisGetter.deleteSiteActiveUser(`${redisStatisticsKey}:${app.host}`);
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
    /** If invoice sent - check for suspended */
    if (payable < invoice) {
      await App.updateMany({ owner: app.owner, inherited: true }, { status: STATUSES.SUSPENDED });
      await websiteRefunds.deleteOne(
        { status: REFUND_STATUSES.PENDING, type: REFUND_TYPES.WEBSITE_REFUND, userName: app.owner },
      );
    }
    await redisGetter.deleteSiteActiveUser(`${redisStatisticsKey}:${app.host}`);
    await new Promise((resolve) => setTimeout(resolve, timeout));
  }
};

const sendError = async (error) => {
  Sentry.captureException(error);
  await sendSentryNotification(error);
};
