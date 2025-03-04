const _ = require('lodash');
const { GUEST_WALLET_OPERATIONS, PAYMENT_HISTORIES_TYPES } = require('../../../constants/campaignsData');
const { paymentHistory } = require('../../../models');

const getGuestBalanceHistory = async ({
  userName, skip, limit, tableView, endDate, startDate,
}) => {
  let payable = 0;
  const pipeline = [
    { $match: { userName, type: { $in: GUEST_WALLET_OPERATIONS } } },
    { $sort: { createdAt: 1 } },
  ];

  if (tableView) {
    pipeline[0].$match.$and = [
      { createdAt: { $gte: startDate } },
      { createdAt: { $lte: endDate } }];
  }

  const { result: histories, error } = await paymentHistory.aggregate(pipeline);
  if (error) return { error };

  _.map(histories, (history) => {
    if (_.get(history, 'details.transactionId')) return;
    switch (history.type) {
      case PAYMENT_HISTORIES_TYPES.USER_TO_GUEST_TRANSFER:
      case PAYMENT_HISTORIES_TYPES.DEMO_POST:
      case PAYMENT_HISTORIES_TYPES.DEMO_DEBT:
        history.balance = _.round(payable + history.amount, 3);
        payable = _.round(history.balance, 3);
        break;
      case PAYMENT_HISTORIES_TYPES.DEMO_USER_TRANSFER:
        history.balance = _.round(payable - history.amount, 3);
        payable = _.round(history.balance, 3);
        break;
    }
  });
  _.reverse(histories);

  return {
    histories: histories.slice(skip, limit + skip),
    payable: _.round(payable, 3),
    hasMore: histories.slice(skip, limit + skip + 1).length > limit,
  };
};

module.exports = {
  getGuestBalanceHistory,
};
