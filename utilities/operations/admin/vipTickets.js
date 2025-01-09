const { vipTicketsModel } = require('models');
const _ = require('lodash');

const getVipTickets = async () => {
  const { result } = await vipTicketsModel.aggregate([
    {
      $group: {
        _id: '$userName',
        purchased: { $sum: 1 },
        used: { $sum: { $cond: [{ $eq: ['$valid', false] }, 1, 0] } },
      },
    },
    {
      $project: {
        userName: '$_id',
        _id: 0,
        purchased: 1,
        used: 1,
      },
    },
    {
      $sort: {
        userName: 1,
      },
    },
  ]);

  const totalPurchased = _.sumBy(result, 'purchased');
  const totalUsed = _.sumBy(result, 'used');

  return {
    result,
    totalPurchased,
    totalUsed,
  };
};

module.exports = {
  getVipTickets,
};
