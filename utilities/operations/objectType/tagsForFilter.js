const { Wobj } = require('../../../models');

const getCategoriesByObjectType = async () => {
  const { wobjects: result } = await Wobj.fromAggregation([
    {
      $match: {
        'authority.administrative': 'wiv01',
      },
    }, {
      $unwind: {
        path: '$fields',
      },
    }, {
      $match: {
        'fields.name': 'categoryItem',
      },
    }, {
      $group: {
        _id: '$fields.body',
        categories: {
          $addToSet: '$fields.tagCategory',
        },
      },
    },
  ]);
};
