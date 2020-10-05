const _ = require('lodash');
const moment = require('moment');
const { ACTIVE_STATUSES } = require('constants/sitesConstants');
const { PAYMENT_TYPES, FEE } = require('constants/sitesConstants');
const { sitesHelper } = require('utilities/helpers');

/** Get data for manage page. In this method, we generate a report for the site owner,
 * in which we include the average data on users on his sites for the last 7 days,
 * calculate the approximate amount of daily debt based on past data,
 * also gives information about the account to which payments need to be made + data for payment */
exports.getManagePage = async ({ userName }) => {
  const { error, apps, payments } = await sitesHelper.getWebsitePayments({ owner: userName });
  if (error) return { error };
  const accountBalance = {
    paid: 0, avgDau: 0, dailyCost: 0, remainingDays: 0,
  };
  accountBalance.paid = _.sumBy(payments, (payment) => {
    if (payment.type === PAYMENT_TYPES.TRANSFER) return payment.amount;
  }) || 0;
  const dataForPayments = await sitesHelper.getPaymentsData();

  if (!apps.length) return { accountBalance, dataForPayments, websites: [] };

  accountBalance.paid -= _.sumBy(payments, (payment) => {
    if (payment.type !== PAYMENT_TYPES.TRANSFER) return payment.amount;
  }) || 0;

  const websites = [];
  for (const site of apps) {
    if (site.deactivatedAt && site.deactivatedAt < moment.utc().subtract(6, 'month').toDate()) continue;
    websites.push(sitesHelper.getWebsiteData(payments, site));
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
