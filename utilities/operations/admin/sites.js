const _ = require('lodash');
const manage = require('../sites/manage');
const { App } = require('../../../models');
const { BILLING_TYPE } = require('../../../constants/sitesConstants');

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
      $project: {
        userName: '$owner',
        status: 1,
        host: 1,
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

module.exports = {
  manageView,
  subscriptionView,
};
