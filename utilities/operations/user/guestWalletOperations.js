const _ = require('lodash');
const { GuestWalletModel } = require('../../../models');
const { GUEST_WALLET_TYPE } = require('../../../constants/common');

exports.getWallet = async ({
  account, symbol, skip, limit,
}) => {
  const { result: history, error } = await GuestWalletModel.find(
    {
      filter: { account, symbol },
      skip,
      limit: limit + 1,
      sort: { _id: -1 },
    },
  );
  if (error) return { error };

  return { result: { history: _.take(history, limit), hasMore: history.length > limit } };
};

exports.getBalance = async ({ account, symbol }) => {
  const { result, error } = await GuestWalletModel.aggregate(
    [
      { $match: { account, symbol } },
      {
        $group: {
          _id: null,
          deposit: {
            $sum: {
              $cond: [
                {
                  $or: [
                    { $in: ['$operation', [GUEST_WALLET_TYPE.AUTHOR_REWARD]] },
                    {
                      $and: [
                        { $eq: ['$to', account] },
                        { $eq: ['$operation', GUEST_WALLET_TYPE.TRANSFER] },
                      ],
                    },
                  ],
                },
                '$$ROOT.quantity',
                '$$REMOVE',
              ],
            },
          },
          withdrawal: {
            $sum: {
              $cond: [
                {
                  $or: [
                    {
                      $and: [
                        { $eq: ['$from', account] },
                        { $eq: ['$operation', GUEST_WALLET_TYPE.TRANSFER] },
                      ],
                    },
                    {
                      $eq: ['$operation', GUEST_WALLET_TYPE.WITHDRAW],
                    },
                  ],
                },
                '$$ROOT.quantity',
                '$$REMOVE',
              ],
            },
          },
        },
      },
      {
        $addFields: {
          balance: {
            $subtract: [
              '$deposit',
              '$withdrawal',
            ],
          },
        },
      },
      {
        $project: {
          balance: {
            $convert: {
              input: '$balance',
              to: 'string',
            },
          },
          _id: 0,
        },
      },
    ],
  );
  if (error) return { error };
  const balance = _.get(result, '[0].balance', '0');
  return { result: { [symbol]: balance === '0E-8' ? '0' : balance } };
};
