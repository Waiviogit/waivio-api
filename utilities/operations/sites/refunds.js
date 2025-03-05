const _ = require('lodash');
const config = require('../../../config');
const {
  App, websitePayments, websiteRefunds,
} = require('../../../models');
const { REFUND_STATUSES } = require('../../../constants/sitesConstants');
const { sitesHelper } = require('../../helpers');

exports.refundsList = async (userName) => {
  const { app, error } = await App.getOne({ host: config.appHost });
  if (error) return { error };
  if (!_.includes(app.admins, userName)) return { error: { status: 401, message: 'Unauthorized' } };
  const { result: refunds, error: refundsError } = await websiteRefunds.find(
    { status: REFUND_STATUSES.PENDING },
  );
  if (refundsError) return { error: refundsError };

  const refundsData = [];
  for (const refund of refunds) {
    const { result } = await websitePayments.find(
      { condition: { userName: refund.userName }, sort: { createdAt: 1 } },
    );
    if (!result || !result.length) continue;
    const { payable } = sitesHelper.getPaymentsTable(result);
    if (payable <= 0) continue;
    refund.amount = payable;
    refundsData.push(refund);
  }
  return { result: refundsData };
};
