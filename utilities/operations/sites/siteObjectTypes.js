const { OBJECT_TYPES } = require('@waivio/objects-processor');
const { getAppAuthorities } = require('../../helpers/appHelper');
const { Wobj } = require('../../../models');

const TYPES_FOR_SITE = [
  OBJECT_TYPES.PRODUCT,
  OBJECT_TYPES.RESTAURANT,
  OBJECT_TYPES.RECIPE,
  OBJECT_TYPES.DISH,
  OBJECT_TYPES.DRINK,
  OBJECT_TYPES.BOOK,
  OBJECT_TYPES.BUSINESS,
];

const getSocialSiteObjectTypes = async ({ app }) => {
  if (!app) return [];
  const authorities = getAppAuthorities(app);

  const { result = [] } = await Wobj.fromAggregation([
    {
      $match: {
        object_type: { $in: TYPES_FOR_SITE },
        'authority.administrative': { $in: authorities },
      },
    },
    {
      $group: {
        _id: '$object_type',
      },
    },
    {
      $project: {
        _id: 0,
        object_type: '$_id',
      },
    },
  ]);

  return result.map((r) => r.object_type);
};

module.exports = {
  getSocialSiteObjectTypes,
};
