const _ = require('lodash');
const manage = require('../sites/manage');
const { App, websitePayments } = require('../../../models');
const {
  BILLING_TYPE,
  PAYMENT_TYPES,
} = require('../../../constants/sitesConstants');

const sortUserNames = (users) => _.sortBy(users, [
  (user) => user.userName.includes('_'),
  'userName',
]);

const manageView = async () => {
  const { result: users } = await App.aggregate([
    {
      $match: {
        inherited: true,
        canBeExtended: false,
      },

    },
    {
      $group: {
        _id: '$owner',
      },
    },
    {
      $project: {
        userName: '$_id',
        _id: 0,
      },
    },
    {
      $sort: {
        userName: 1,
      },
    },
  ]);

  const views = await Promise.all(users.map(async (el) => {
    const page = await manage.getManagePage({ userName: el.userName });

    return {
      ...page,
      userName: el.userName,
    };
  }));

  return sortUserNames(views);
};

const subscriptionView = async () => {
  const { result: users } = await App.aggregate([
    {
      $match: {
        inherited: true,
        canBeExtended: false,
        billingType: BILLING_TYPE.PAYPAL_SUBSCRIPTION,
      },

    },
    {
      $group: {
        _id: '$owner',
        websites: { $push: { status: '$status', host: '$host' } },
      },
    },
    {
      $project: {
        userName: '$_id',
        websites: 1,
        _id: 0,
      },
    },
    {
      $sort: {
        userName: 1,
      },
    },
  ]);

  return sortUserNames(users);
};

const creditsView = async ({ skip, limit }) => {
  const { result } = await websitePayments.aggregate([
    { $match: { type: PAYMENT_TYPES.CREDIT } },
    { $sort: { _id: -1 } },
    { $skip: skip },
    { $limit: limit + 1 },
  ]);

  return {
    result: _.take(result, limit),
    hasMore: result?.length > limit,
  };
};

module.exports = {
  manageView,
  subscriptionView,
  creditsView,
};
