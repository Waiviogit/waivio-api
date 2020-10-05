const _ = require('lodash');
const { PAYMENT_TYPES } = require('constants/sitesConstants');
const { sitesHelper } = require('utilities/helpers');

/** Get data for report page, if host exist - return only debt records,
 * always return all owner apps hosts */
exports.getReport = async ({
  userName, startDate, endDate, host,
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
    ({ payments: sortedPayments } = await sitesHelper.getPaymentsTable(_.filter(payments,
      (payment) => payment.type === PAYMENT_TYPES.WRITE_OFF)));
  } else ({ payments: sortedPayments } = await sitesHelper.getPaymentsTable(payments));

  return { ownerAppNames, payments: sortedPayments, dataForPayments };
};
