const _ = require('lodash');
const moment = require('moment');
const objectBotRequests = require('utilities/requests/objectBotRequests');
const { OBJECT_BOT } = require('constants/requestData');
const { STATUSES, ACTIVE_STATUSES } = require('constants/sitesConstants');
const { PAYMENT_TYPES, FEE } = require('constants/sitesConstants');
const { App, websitePayments, User } = require('models');

/** Method for validate and create user site */
exports.createApp = async (params) => {
  const { error, parent } = await this.availableCheck(params);
  if (error) return { error };
  params.host = `${params.name}.${parent.host}`;
  params.parent = parent._id;
  const { result, error: createError } = await objectBotRequests.sendCustomJson(params,
    `${OBJECT_BOT.HOST}${OBJECT_BOT.BASE_URL}${OBJECT_BOT.CREATE_WEBSITE}`);
  if (createError) {
    return {
      error:
        { status: _.get(createError, 'response.status'), message: _.get(createError, 'response.statusText', 'Forbidden') },
    };
  }
  return { result: !!result };
};

/** Check for available domain for user site */
exports.availableCheck = async (params) => {
  const { result: parent } = await App.findOne({ _id: params.parentId, canBeExtended: true });
  if (!parent) return { error: { status: 404, message: 'Parent not found' } };
  const { result: app } = await App.findOne({ host: `${params.name}.${parent.host}` });
  if (app) return { error: { status: 409, message: 'Subdomain already exists' } };
  return { result: true, parent };
};

/** Get list of all parents available for extend */
exports.getParentsList = async () => {
  const { result: parents, error } = await App.find({ canBeExtended: true });
  if (error) return { error };
  return {
    parents: _.map(parents, (parent) => ({ domain: parent.host, _id: parent._id.toString() })),
  };
};

/** Get all user hosts */
exports.getUserApps = async (params) => {
  const { result: apps, error } = await App.find({
    owner: params.userName,
    inherited: true,
    $or: [{ deactivatedAt: null }, { deactivatedAt: { $gt: moment.utc().subtract(6, 'month').toDate() } }],
  });
  if (error) return { error };

  return { result: _.map(apps, 'host') };
};

/** For different types of sites, different configurations will be available,
 * in this method we send to the front a list of allowed configurations for this site */
exports.getConfigurationsList = async (host) => {
  const { result } = await App.findOne({ host, inherited: true });
  if (!result) return { error: { status: 404, message: 'App not Found!' } };

  return { result: _.get(result, 'configuration.configurationFields', []) };
};

/** Get data for manage page. In this method, we generate a report for the site owner,
 * in which we include the average data on users on his sites for the last 7 days,
 * calculate the approximate amount of daily debt based on past data,
 * also gives information about the account to which payments need to be made + data for payment */
exports.getManagePageData = async ({ userName }) => {
  const { error, apps, payments } = await getWebsitePayments({ owner: userName });
  if (error) return { error };
  const accountBalance = {
    paid: 0, avgDau: 0, dailyCost: 0, remainingDays: 0,
  };
  accountBalance.paid = _.sumBy(payments, (payment) => {
    if (payment.type === PAYMENT_TYPES.TRANSFER) return payment.amount;
  }) || 0;
  const dataForPayments = await getPaymentsData();

  if (!apps.length) return { accountBalance, dataForPayments, websites: [] };

  accountBalance.paid -= _.sumBy(payments, (payment) => {
    if (payment.type !== PAYMENT_TYPES.TRANSFER) return payment.amount;
  }) || 0;

  const websites = [];
  for (const site of apps) {
    if (site.deactivatedAt && site.deactivatedAt < moment.utc().subtract(6, 'month').toDate()) continue;
    websites.push(getWebsiteData(payments, site));
  }

  accountBalance.avgDau = Math.trunc(_.meanBy(websites, (site) => site.averageDau));
  const dailyCost = _.round(accountBalance.avgDau * FEE.perUser, 3);

  accountBalance.dailyCost = (dailyCost < FEE.minimumValue ? FEE.minimumValue : dailyCost)
      * _.filter(apps, (app) => _.includes(ACTIVE_STATUSES, app.status)).length;

  accountBalance.remainingDays = accountBalance.dailyCost > 0
    ? Math.trunc(accountBalance.paid > 0 ? accountBalance.paid : 0 / accountBalance.dailyCost)
    : null;

  return {
    websites,
    accountBalance,
    dataForPayments,
  };
};

/** Get data for report page, if host exist - return only debt records,
 * always return all owner apps hosts */
exports.getReport = async ({
  userName, startDate, endDate, host,
}) => {
  let sortedPayments;
  const {
    payments, ownerAppNames, error,
  } = await getWebsitePayments({
    host, owner: userName, startDate, endDate,
  });
  if (error) return { error };
  const dataForPayments = await getPaymentsData();
  if (!payments.length) return { ownerAppNames, payments, dataForPayments };

  if (host || startDate || endDate) {
    sortedPayments = await getPaymentsTable(_.filter(payments,
      (payment) => payment.type === PAYMENT_TYPES.WRITE_OFF));
  } else sortedPayments = await getPaymentsTable(payments);

  return { ownerAppNames, payments: sortedPayments, dataForPayments };
};

exports.getSiteAuthorities = async (params, path) => {
  const { result, error } = await App.findOne({ host: params.host, owner: params.userName });
  if (error) return { error };
  if (!result) return { error: { status: 404, message: 'Site dont find!' } };
  let condition = {};
  switch (path) {
    case 'moderators':
      condition = { name: { $in: result.moderators } };
      break;
    case 'administrators':
      condition = { name: { $in: result.admins } };
      break;
    case 'authorities':
      condition = { name: { $in: result.authority } };
      break;
  }
  const { result: users, error: usersError } = await User.findWithSelect(condition, {
    name: 1, alias: 1, posting_json_metadata: 1, json_metadata: 1,
  });
  if (usersError) return { error: usersError };

  return { result: users };
};

/** _______________________________PRIVATE METHODS____________________________________ */
const getWebsitePayments = async ({
  owner, host, startDate, endDate,
}) => {
  let byHost;
  const { result: apps, error: appsError } = await App.find({
    owner, inherited: true,
  });
  if (appsError) return { error: appsError };
  const ownerAppNames = _.map(apps, 'host');
  if (host) {
    ({ result: byHost } = await App.findOne({
      inherited: true,
      $or: [{ deactivatedAt: null }, { deactivatedAt: { $gt: moment.utc().subtract(6, 'month').toDate() } }],
      host,
    }));
    if (!byHost) return { ownerAppNames, payments: [] };
  }
  const condition = host
    ? { host }
    : { $or: [{ userName: owner }, { host: { $in: ownerAppNames } }] };

  const { error: paymentError, result: payments } = await websitePayments.find({
    condition: {
      ...condition,
      $and: [
        { createdAt: { $gt: startDate || moment.utc(1).toDate() } },
        { createdAt: { $lt: endDate || moment.utc().toDate() } }],
    },
    sort: { createdAt: 1 },
  });
  if (paymentError) return { error: paymentError };
  return {
    ownerAppNames,
    payments,
    apps,
  };
};

const getPaymentsTable = (payments) => {
  let payable = 0;
  payments = _.map(payments, (payment) => {
    switch (payment.type) {
      case PAYMENT_TYPES.TRANSFER:
        payment.balance = payable + payment.amount;
        payable = payment.balance;
        return _.pick(payment, ['userName', 'balance', 'createdAt', 'amount', 'type', '_id']);
      case PAYMENT_TYPES.WRITE_OFF:
      case PAYMENT_TYPES.REFUND:
        payment.balance = payable - payment.amount;
        payable = payment.balance;
        return _.pick(payment, ['userName', 'balance', 'host', 'createdAt', 'amount', 'type', 'countUsers', '_id']);
    }
  });
  _.reverse(payments);
  return payments;
};

const getPaymentsData = async () => {
  const { user } = await User.getOne(FEE.account, {
    alias: 1, json_metadata: 1, posting_json_metadata: 1, name: 1,
  });
  return { user, memo: FEE.id };
};

const getWebsiteData = (payments, site) => {
  const lastWriteOff = _.filter(payments, (payment) => payment.host === site.host
      && payment.type === PAYMENT_TYPES.WRITE_OFF
      && payment.createdAt > moment.utc().subtract(7, 'day').startOf('day').toDate());

  return {
    status: site.status,
    name: site.name,
    parent: site.host.replace(`${site.name}.`, ''),
    averageDau: lastWriteOff.length
      ? Math.trunc(_.meanBy(lastWriteOff, (writeOff) => writeOff.countUsers))
      : 0,
  };
};
