const { REQUIREDFIELDS, LOW_PRIORITY_STATUS_FLAGS } = require('utilities/constants');
const {
  Wobj, ObjectType, Campaign, User, paymentHistory,
} = require('models');
const _ = require('lodash');
const moment = require('moment');

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

// check the ability to reserve this campaign
const campaignValidation = async (campaigns) => {
  const validCapaigns = [];
  await Promise.all(campaigns.map(async (campaign) => {
    if (campaign.reservation_timetable[moment().format('dddd').toLowerCase()]
        && _.floor(campaign.budget / campaign.reward) > _.filter(campaign.users, (user) => user.status === 'assigned'
        && user.createdAt > moment().startOf('month')).length) {
      const { result, error } = await Wobj.findOne(campaign.requiredObject);
      if (error) return;
      campaign.required_object = result;
      const { user, error: userError } = await User.getOne(campaign.guideName);
      if (userError || !user) return;

      const { result: totalPayed } = await paymentHistory.find(
        { sponsor: campaign.guideName, type: 'transfer' },
      );
      campaign.guide = {
        name: campaign.guideName,
        wobjects_weight: user.wobjects_weight,
        alias: user.alias,
        totalPayed: _.sumBy(totalPayed, (count) => count.amount),
      };
      validCapaigns.push(campaign);
    }
  }));
  return validCapaigns;
};

module.exports = async ({
  name, filter, wobjLimit, wobjSkip, sort,
}) => {
  const { objectType, error: objTypeError } = await ObjectType.getOne({ name });

  if (objTypeError) return { error: objTypeError };
  const { wobjects, error: wobjError } = await getWobjWithFilters({
    objectType: name, filter, limit: wobjLimit + 1, skip: wobjSkip, sort,
  });
  if (wobjError) return { error: wobjError };

  switch (name) {
    case 'restaurant':
      await Promise.all(wobjects.map(async (wobj) => {
        const { result, error } = await Campaign.findByPrimeObj({ requiredObject: wobj.author_permlink, status: 'active' });
        if (error || !result.length) return;
        wobj.campaigns = {
          min_reward: (_.minBy(result, 'reward')).reward,
          max_reward: (_.maxBy(result, 'reward')).reward,
        };
      }));
      break;
    case 'dish':
      await Promise.all(wobjects.map(async (wobj) => {
        const { result, error } = await Campaign.findByPrimeObj({ objects: wobj.author_permlink, status: 'active' });
        if (error || !result.length) return;
        const validCompanies = await campaignValidation(result);
        wobj.campaigns = validCompanies;
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
