const _ = require('lodash');
const { PAYMENT_TYPES, FEE, STATUSES } = require('constants/sitesConstants');
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
  const prices = {
    minimumValue: FEE.minimumValue,
    perSuspended: FEE.perSuspended,
    perUser: FEE.perUser,
  };

  accountBalance.paid -= _.sumBy(payments, (payment) => {
    if (payment.type !== PAYMENT_TYPES.TRANSFER) return payment.amount;
  }) || 0;

  if (!apps.length) {
    return {
      accountBalance, dataForPayments, websites: [], prices,
    };
  }

  const websites = [];
  for (const site of apps) {
    websites.push(sitesHelper.getWebsiteData(payments, site));
  }

  accountBalance.avgDau = _.sumBy(websites, (site) => site.averageDau) || 0;

  accountBalance.dailyCost = _.chain(websites)
    .filter((site) => site.status !== STATUSES.SUSPENDED)
    .sumBy((site) => (site.averageDau < FEE.minimumValue / FEE.perUser ? 1 : site.averageDau * FEE.perUser))
    .round(3)
    .value() || 0;

  accountBalance.remainingDays = accountBalance.dailyCost > 0
    ? Math.trunc(accountBalance.paid > 0 ? accountBalance.paid / accountBalance.dailyCost : 0)
    : 0;

  return {
    websites,
    accountBalance,
    dataForPayments,
    prices,
  };
};
