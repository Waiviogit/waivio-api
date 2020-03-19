const { REQUIREDFIELDS, LOW_PRIORITY_STATUS_FLAGS } = require('utilities/constants');
const {
  Wobj, ObjectType, Campaign, User,
} = require('models');
const _ = require('lodash');
const { objectTypeHelper } = require('utilities/helpers');

const validateInput = ({ filter, sort }) => {
  if (filter) {
    // validate map filter
    if (filter.map) {
      if (!filter.map.coordinates || !Array.isArray(filter.map.coordinates)
          || filter.map.coordinates.length !== 2 || !filter.map.radius) {
        return false;
      }
    }
    // ///////////////////////////////// //
    // validate another specific filters //
    // ///////////////////////////////// //
  }
  if (sort) {
    if (sort === 'proximity' && !_.get(filter, 'map')) return false;
  }
  return true;
};

const getWobjWithFilters = async ({
  objectType, filter, limit = 30, skip = 0, sort = 'weight',
}) => {
  const aggregationPipeline = [];

  if (!validateInput({ filter, sort })) {
    return { error: { status: 422, message: 'Filter or Sort param is not valid!' } };
  }
  // special filter map
  if (filter && filter.map) {
    aggregationPipeline.push({
      $geoNear: {
        near: { type: 'Point', coordinates: [filter.map.coordinates[1], filter.map.coordinates[0]] },
        distanceField: 'proximity',
        maxDistance: filter.map.radius,
        spherical: true,
        limit,
      },
    });
    delete filter.map;
  }
  aggregationPipeline.push({
    $match: {
      object_type: objectType,
    },
  });
  // special filter searchString
  if (_.get(filter, 'searchString')) {
    aggregationPipeline.push({
      $match: {
        $or: [
          { fields: { $elemMatch: { name: 'name', body: { $regex: `\\b${filter.searchString}.*\\b`, $options: 'i' } } } },
          { // if 4-th symbol is "-" - search by "author_permlink" too
            author_permlink: { $regex: `${_.get(filter.searchString, '[3]') === '-' ? `^${filter.searchString}` : '_'}`, $options: 'i' },
          },
        ],
      },
    });
    delete filter.searchString;
  }
  if (!_.isEmpty(filter)) {
    // ///////////////////////////// ///
    // place here additional filters ///
    // ///////////////////////////// ///
    for (const filterItem in filter) {
      for (const filterValue of filter[filterItem]) {
        const cond = {
          $match:
                { fields: { $elemMatch: { name: filterItem, body: filterValue } } },
        };
        // additional filter for field "rating"

        if (filterItem === 'rating') {
          cond.$match.fields.$elemMatch.average_rating_weight = { $gte: 8 };
        }
        aggregationPipeline.push(cond);
      }
    }
  }
  aggregationPipeline.push(
    {
      $addFields: {
        priority: {
          $cond: {
            if: { $in: ['$status.title', LOW_PRIORITY_STATUS_FLAGS] },
            then: 0,
            else: 1,
          },
        },
      },
    },
    { $sort: { priority: -1, [sort]: sort !== 'proximity' ? -1 : 1, _id: -1 } },
    { $skip: skip },
    { $limit: limit },
    { $addFields: { fields: { $filter: { input: '$fields', as: 'field', cond: { $in: ['$$field.name', REQUIREDFIELDS] } } } } },
    {
      $lookup: {
        from: 'wobjects', localField: 'parent', foreignField: 'author_permlink', as: 'parent',
      },
    },
    { $unwind: { path: '$parent', preserveNullAndEmptyArrays: true } },
  );
  // get wobjects by pipeline
  const { wobjects, error: aggrError } = await Wobj.fromAggregation(aggregationPipeline);

  if (aggrError) {
    if (aggrError.status === 404) return { wobjects: [] };
    return { error: aggrError };
  }
  return { wobjects };
};

module.exports = async ({
  name, filter, wobjLimit, wobjSkip, sort, userName,
}) => {
  const { objectType, error: objTypeError } = await ObjectType.getOne({ name });

  if (objTypeError) return { error: objTypeError };
  const { wobjects, error: wobjError } = await getWobjWithFilters({
    objectType: name, filter, limit: wobjLimit + 1, skip: wobjSkip, sort,
  });
  if (wobjError) return { error: wobjError };
  const { user } = await User.getOne(userName);
  switch (name) {
    case 'restaurant':
      await Promise.all(wobjects.map(async (wobj) => {
        const { result, error } = await Campaign.findByCondition({ requiredObject: wobj.author_permlink, status: 'active' });
        if (error || !result.length) return;
        const eligibleCampaigns = _.map(result,
          (campaign) => _.every(objectTypeHelper.requirementFilters(campaign, user, true),
            (cond) => !!cond));
        if (_.some(eligibleCampaigns, (eligible) => !!eligible)) {
          wobj.campaigns = {
            min_reward: (_.minBy(result, 'reward')).reward,
            max_reward: (_.maxBy(result, 'reward')).reward,
          };
        }
      }));
      break;
    case 'dish':
      await Promise.all(wobjects.map(async (wobj) => {
        const { result, error } = await Campaign.findByCondition({ objects: wobj.author_permlink, status: 'active' });
        if (error || !result.length) return;
        wobj.propositions = await objectTypeHelper.campaignFilter(result, user);
      }));
      break;
  }

  objectType.related_wobjects = wobjects;
  if (objectType.related_wobjects.length === wobjLimit + 1) {
    objectType.hasMoreWobjects = true;
    objectType.related_wobjects = objectType.related_wobjects.slice(0, wobjLimit);
  } else {
    objectType.hasMoreWobjects = false;
  }
  return { objectType };
};
