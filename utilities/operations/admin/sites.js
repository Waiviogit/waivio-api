const manage = require('utilities/operations/sites/manage');
const { App } = require('models');

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

  return views;
};

module.exports = {
  manageView,
};
