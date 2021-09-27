const { Wobj } = require('models');
const _ = require('lodash');
const searchHelper = require('utilities/helpers/searchHelper');
const { REMOVE_OBJ_STATUSES } = require('constants/wobjectsData');

exports.getExpertsFromArea = async ({
  box, skip, limit, app,
}) => {
  const pipe = await makeExpertsByAreaPipe({
    box, skip, limit, app,
  });
  const { wobjects: experts, error } = await Wobj.fromAggregation(pipe);
  if (error) return { error };
  return { users: _.take(experts, limit), hasMore: experts.length > limit };
};

const makeExpertsByAreaPipe = async ({
  box, skip, limit, app,
}) => {
  const { supportedTypes, crucialWobjects, forSites } = await searchHelper.getAppInfo({ app });
  return [
    {
      $match: {
        map: {
          $geoWithin: {
            $box: [box.bottomPoint, box.topPoint],
          },
        },
      },
    },
    {
      $match: {
        'status.title': { $nin: REMOVE_OBJ_STATUSES },
        ...(!_.isEmpty(supportedTypes) && { object_type: { $in: supportedTypes } }),
        ...(forSites && { author_permlink: { $in: crucialWobjects } }),
      },
    },
    {
      $lookup: {
        from: 'user_wobjects',
        localField: 'author_permlink',
        foreignField: 'author_permlink',
        as: 'experts',
      },
    },
    {
      $unwind: { path: '$experts' },
    },
    {
      $replaceRoot: { newRoot: '$experts' },
    },
    {
      $group: { _id: '$user_name', weight: { $sum: '$weight' } },
    },
    {
      $sort: { weight: -1 },
    },
    {
      $skip: skip,
    },
    {
      $limit: limit + 1,
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: 'name',
        as: 'user',
      },
    },
    {
      $project: {
        _id: 0,
        name: '$_id',
        followers_count: { $arrayElemAt: ['$user.followers_count', 0] },
        weight: '$weight',
      },
    },
  ];
};
