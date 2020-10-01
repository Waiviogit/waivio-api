const _ = require('lodash');
const moment = require('moment');
const { STATUSES, ACTIVE_STATUSES } = require('constants/sitesConstants');
const { PAYMENT_TYPES, FEE } = require('constants/sitesConstants');
const { App, websitePayments, User } = require('models');

exports.createApp = async (params) => {
  const { error, parent } = await this.availableCheck(params);
  if (error) return { error };
  params.host = `${params.name}.${parent.host}`;
  params.parent = parent._id;
  const { result, error: createError } = await App.create(params);
  if (createError) return { error: createError };
  return { result: !!result };
};

exports.availableCheck = async (params) => {
  const { result: parent } = await App.findOne({ _id: params.parentId, canBeExtended: true });
  if (!parent) return { error: { status: 404, message: 'Parent not found' } };
  const { result: app } = await App.findOne({ host: `${params.name}.${parent.host}` });
  if (app) return { error: { status: 409, message: 'Subdomain already exists' } };
  return { result: true, parent };
};

exports.getParentsList = async () => {
  const { result: parents, error } = await App.find({ canBeExtended: true });
  if (error) return { error };
  return {
    parents: _.map(parents, (parent) => ({ domain: parent.host, _id: parent._id.toString() })),
  };
};

exports.getUserApps = async (params) => {
  const { result: apps, error } = await App.find({
    owner: params.userName,
    inherited: true,
    $or: [{ deactivatedAt: null }, { deactivatedAt: { $gt: moment.utc().subtract(6, 'month').toDate() } }],
  });
  if (error) return { error };

  return { result: _.map(apps, 'host') };
};

exports.getConfigurationsList = async (host) => {
  const { result } = await App.findOne({ host, inherited: true });
  if (!result) return { error: { status: 404, message: 'App not Found!' } };

  return { result: _.get(result, 'configuration.configurationFields', []) };
};

exports.getWebsitePayments = async ({
  owner, host, startDate, endDate,
}) => {
  let byHost;
  const { result: apps, error: appsError } = await App.find({
    owner, inherited: true,
    // $or: [{ deactivatedAt: null }, { deactivatedAt: { $gt: moment.utc().subtract(6, 'month').toDate() } }],
  });
  if (appsError) return { error: appsError };
  const ownerAppNames = _.map(apps, 'host');
  if (host) {
    ({ result: byHost } = await App.find({
      // $or: [{ deactivatedAt: null }, { deactivatedAt: { $gt: moment.utc().subtract(6, 'month').toDate() } }],
      inherited: true,
      host,
    }));
    if (!byHost) return { ownerAppNames, payments: [] };
  }

  const { error: paymentError, result: payments } = await websitePayments.find({
    condition: {
      $or: [
        { userName: host ? byHost.owner : owner },
        { host: { $in: _.compact(host ? [_.get(byHost, 'host')] : [...ownerAppNames, _.get(byHost, 'host name')]) } },
      ],
      $and: [
        { createdAt: { $gt: startDate || moment.utc(1).toDate() } },
        { createdAt: { $lt: endDate || moment.utc().toDate() } }],
    },
    sort: { createdAt: -1 },
  });
  if (paymentError) return { error: paymentError };
  return {
    ownerAppNames,
    payments,
    apps,
  };
};

exports.getManagePageData = async ({ userName }) => {
  const { error, apps, payments } = await this.getWebsitePayments({ owner: userName });
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

const getPaymentsData = async () => {
  const { user } = await User.getOne(FEE.account, {
    alias: 1, json_metadata: 1, posting_json_metadata: 1, name: 1,
  });
  return { user, id: FEE.id };
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
