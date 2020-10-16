const _ = require('lodash');
const { getNamespace } = require('cls-hooked');
const moment = require('moment');
const { redisGetter } = require('utilities/redis');
const { PAYMENT_TYPES, FEE } = require('constants/sitesConstants');
const { App, websitePayments, User } = require('models');
const { FIELDS_NAMES } = require('constants/wobjectsData');

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

exports.searchTags = async (params) => {
  const { tags, error } = await redisGetter.getTagCategories({ start: 0, key: `${FIELDS_NAMES.TAG_CATEGORY}:${params.category}`, end: -1 });
  if (error) return { error };
  return { result: _.filter(tags, (tag) => new RegExp(params.string).test(tag)) };
};

exports.getWebsitePayments = async ({
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

exports.getPaymentsTable = (payments) => {
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
  return { payments, payable };
};

exports.getPaymentsData = async () => {
  const { user } = await User.getOne(FEE.account, {
    alias: 1, json_metadata: 1, posting_json_metadata: 1, name: 1,
  });
  return { user, memo: FEE.id };
};

exports.getWebsiteData = (payments, site) => {
  const lastWriteOff = _.filter(payments, (payment) => payment.host === site.host
      && payment.type === PAYMENT_TYPES.WRITE_OFF
      && payment.createdAt > moment.utc().subtract(7, 'day').startOf('day').toDate());

  return {
    status: site.status,
    name: site.name,
    host: site.host,
    parent: site.host.replace(`${site.name}.`, ''),
    averageDau: lastWriteOff.length
      ? Math.trunc(_.meanBy(lastWriteOff, (writeOff) => writeOff.countUsers))
      : 0,
  };
};

exports.siteInfo = async (host) => {
  const { result: app } = await App.findOne({ host, inherited: true });
  if (!app) return { error: { status: 404, message: 'App not found!' } };

  return { result: _.pick(app, ['status']) };
};

exports.firstLoad = async ({ app }) => ({
  result: _.pick(app, ['configuration', 'host', 'googleAnalyticsTag',
    'beneficiary', 'supported_object_types', 'status', 'mainPage']),
});

exports.getSessionApp = async () => {
  const session = getNamespace('request-session');
  const host = session.get('host');

  return App.findOne({ host });
};
