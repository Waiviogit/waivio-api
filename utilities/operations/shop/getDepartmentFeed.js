const _ = require('lodash');
const {
  REMOVE_OBJ_STATUSES,
  REQUIREDFILDS_WOBJ_LIST,
  FIELDS_NAMES,
} = require('constants/wobjectsData');
const wObjectHelper = require('utilities/helpers/wObjectHelper');
const campaignsV2Helper = require('utilities/helpers/campaignsV2Helper');
const { Wobj } = require('models');

const makeFilterCondition = (filter = {}) => {
  const result = {};
  if (_.get(filter, FIELDS_NAMES.TAG_CATEGORY)) {
    const condition = [];
    for (const category of filter.tagCategory) {
      condition.push({
        fields: {
          $elemMatch: {
            name: FIELDS_NAMES.CATEGORY_ITEM,
            body: { $in: category.tags },
            tagCategory: category.categoryName,
            weight: { $gte: 0 },
          },
        },
      });
    }

    if (condition.length) result.$or = condition;
  }
  if (filter.rating) {
    result.fields = { $elemMatch: { average_rating_weight: { $gte: filter.rating } } };
  }
  return result;
};

module.exports = async ({
  countryCode,
  department = '',
  userName,
  locale,
  filter,
  limit = 3,
  skip = 0,
  user,
  app,
}) => {
  const emptyResp = { department, wobjects: [], hasMore: false };

  const {
    result,
    error,
  } = await Wobj.findObjects({
    filter: {
      departments: department,
      'status.title': { $nin: REMOVE_OBJ_STATUSES },
      ...makeFilterCondition(filter),
    },
    options: {
      skip,
      limit: limit + 1,
      sort: { weight: -1 },
    },
  });

  if (error) return emptyResp;
  if (_.isEmpty(result)) return emptyResp;
  const processed = await wObjectHelper.processWobjects({
    wobjects: _.take(result, limit),
    fields: REQUIREDFILDS_WOBJ_LIST,
    reqUserName: userName,
    app,
    locale,
    countryCode,
  });

  await campaignsV2Helper.addNewCampaignsToObjects({ user, wobjects: processed });

  return {
    department,
    wobjects: processed,
    hasMore: result.length > limit,
  };
};
