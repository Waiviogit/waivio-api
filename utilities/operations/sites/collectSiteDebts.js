const _ = require('lodash');
const Sentry = require('@sentry/node');
const { sendSentryNotification } = require('../../helpers/sentryHelper');
const { App } = require('../../../models');
const { redisGetter } = require('../../redis');
const objectBotRequests = require('../../requests/objectBotRequests');
const { OBJECT_BOT } = require('../../../constants/requestData');
const {
  redisStatisticsKey, FEE, STATUSES, TEST_DOMAINS, PAYMENT_DESCRIPTION,
} = require('../../../constants/sitesConstants');

exports.dailyDebt = async (timeout = 200) => {
  const { result: apps, error } = await App.find(
    {
      inherited: true,
      status: { $in: [STATUSES.INACTIVE, STATUSES.PENDING, STATUSES.ACTIVE] },
    },
    {},
    {
      host: 1,
      parent: 1,
      owner: 1,
      status: 1,
    },
  );
  if (error) return sendError(error);
  for (const app of apps) {
    if (!await this.checkForTestSites(app.parent)) continue;

    /** Collect data for debt calculation */
    const todayUsers = await redisGetter.getSiteActiveUser(`${redisStatisticsKey}:${app.host}`);
    const countUsers = _.get(todayUsers, 'length', 0);

    const data = {
      amount: calcDailyDebtInvoice({ countUsers, status: app.status }),
      description: addDescriptionMessage(app.status),
      userName: app.owner,
      countUsers,
      host: app.host,
    };
    const { error: createError } = await objectBotRequests.sendCustomJson(
      data,
      `${OBJECT_BOT.HOST}${OBJECT_BOT.BASE_URL}${OBJECT_BOT.SEND_INVOICE}`,
      false,
    );
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
  const { result, error } = await App.findOne({ _id: parent }, {}, { host: 1 });
  if (error) {
    await sendError(error);
    return false;
  }
  if (process.env.NODE_ENV === 'staging' && _.includes(TEST_DOMAINS, result.host)) return true;
  return process.env.NODE_ENV === 'production' && !_.includes(TEST_DOMAINS, result.host);
};

exports.dailySuspendedDebt = async (timeout = 200) => {
  const { result: apps, error } = await App.find(
    {
      inherited: true, status: STATUSES.SUSPENDED,
    },
    {},
    {
      host: 1,
      parent: 1,
      owner: 1,
      status: 1,
    },
  );
  if (error) return sendError(error);
  for (const app of apps) {
    if (!await this.checkForTestSites(app.parent)) continue;

    const data = {
      description: addDescriptionMessage(app.status),
      amount: FEE.perInactive,
      userName: app.owner,
      host: app.host,
      countUsers: 0,
    };

    const { error: createError } = await objectBotRequests.sendCustomJson(
      data,
      `${OBJECT_BOT.HOST}${OBJECT_BOT.BASE_URL}${OBJECT_BOT.SEND_INVOICE}`,
      false,
    );
    if (createError) {
      console.error(`Request for create invoice for suspended host ${data.host} 
      with amount ${data.amount}, daily users: ${data.countUsers} failed!`);
      await sendError(Object.assign(createError, data));
      continue;
    }

    await new Promise((resolve) => setTimeout(resolve, timeout));
  }
};

const calcDailyDebtInvoice = ({ countUsers, status }) => {
  if (status === STATUSES.ACTIVE) {
    return countUsers * FEE.perUser < FEE.minimumValue
      ? FEE.minimumValue
      : _.round(countUsers * FEE.perUser, 3);
  }
  return FEE.perInactive;
};

const addDescriptionMessage = (status) => {
  if (status === STATUSES.ACTIVE) return PAYMENT_DESCRIPTION.HOSTING_FEE;
  return PAYMENT_DESCRIPTION.RESERVATION;
};
