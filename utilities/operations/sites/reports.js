const _ = require('lodash');
const { PAYMENT_TYPES } = require('constants/sitesConstants');
const { sitesHelper } = require('utilities/helpers');
const { CurrenciesRate } = require('models');
const moment = require('moment');

const addCurrencyRates = async ({ payments, currency }) => {
  if (currency === 'USD') return _.map(payments, (el) => ({ ...el, currencyRate: 1 }));
  const datesArray = _.uniq(_.map(payments, (el) => moment(el.createdAt).format('YYYY-MM-DD')));

  const { result } = await CurrenciesRate.find({
    base: 'USD',
    dateString: { $in: datesArray },
  });

  return _.map(payments, (el) => {
    const rate = _.find(result, (r) => r.dateString === moment(el.createdAt).format('YYYY-MM-DD'));
    if (!rate) return el;
    return {
      ...el,
      currencyRate: rate?.rates[currency],
    };
  });
};

/** Get data for report page, if host exist - return only debt records,
 * always return all owner apps hosts */
exports.getReport = async ({
  userName, startDate, endDate, host, currency,
}) => {
  let sortedPayments;
  const {
    payments, ownerAppNames, error,
  } = await sitesHelper.getWebsitePayments({
    host, owner: userName, startDate, endDate,
  });
  if (error) return { error };
  const dataForPayments = await sitesHelper.getPaymentsData();
  if (!payments.length) return { ownerAppNames, payments, dataForPayments };

  if (host || startDate || endDate) {
    ({ payments: sortedPayments } = await sitesHelper.getPaymentsTable(_.filter(
      payments,
      (payment) => payment.type === PAYMENT_TYPES.WRITE_OFF,
    )));
  } else ({ payments: sortedPayments } = await sitesHelper.getPaymentsTable(payments));

  if (currency) {
    const paymentsCurrency = await addCurrencyRates({ payments: sortedPayments, currency });
    return { ownerAppNames, payments: paymentsCurrency, dataForPayments };
  }

  return { ownerAppNames, payments: sortedPayments, dataForPayments };
};
