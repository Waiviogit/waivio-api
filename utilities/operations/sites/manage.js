const BigNumber = require('bignumber.js');
const _ = require('lodash');
const {
  PAYMENT_TYPES, FEE, INACTIVE_STATUSES, POSITIVE_SUM_TYPES,
  BILLING_TYPE,
} = require('../../../constants/sitesConstants');
const { sitesHelper } = require('../../helpers');

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
  accountBalance.paid = sitesHelper.getSumByPaymentType(payments, POSITIVE_SUM_TYPES)
    .minus(sitesHelper.getSumByPaymentType(payments, [PAYMENT_TYPES.WRITE_OFF]))
    .toNumber();

  const dataForPayments = await sitesHelper.getPaymentsData();
  const prices = {
    minimumValue: FEE.minimumValue,
    perSuspended: FEE.perInactive,
    perUser: FEE.perUser,
  };

  if (!apps.length) {
    return {
      accountBalance, dataForPayments, websites: [], prices,
    };
  }

  const websites = [];
  for (const site of apps) {
    websites.push(sitesHelper.getWebsiteData(payments, site));
  }

  if (websites.length) {
    const canonical = websites.find((el) => !!el.useForCanonical);
    if (!canonical) {
      const firstActive = _.minBy(websites, 'createdAt');
      firstActive.useForCanonical = true;
    }
  }

  accountBalance.avgDau = _.sumBy(websites, (site) => site.averageDau) || 0;

  accountBalance.dailyCost = getDailyCost(websites).toNumber();

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

const getDailyCost = (websites) => _
  .reduce(websites, (acc, site) => {
    if (_.includes(INACTIVE_STATUSES, site.status)) return BigNumber(FEE.perInactive).plus(acc);
    if (site.billingType === BILLING_TYPE.PAYPAL_SUBSCRIPTION) return acc;
    return site.averageDau < FEE.minimumValue / FEE.perUser
      ? BigNumber(FEE.minimumValue).plus(acc)
      : BigNumber(site.averageDau).multipliedBy(FEE.perUser).plus(acc);
  }, BigNumber(0));
