const _ = require('lodash');
const { addCampaignsToWobjectsSites } = require('../../helpers/campaignsHelper');
const { REMOVE_OBJ_STATUSES } = require('../../../constants/wobjectsData');
const searchHelper = require('../../helpers/searchHelper');
const { Wobj } = require('../../../models');

exports.getExpertsFromArea = async ({
  box, skip, limit, app,
}) => {
  const pipe = await makeExpertsByAreaPipe({
    box, skip, limit, app,
  });
  const { wobjects: experts, error } = await Wobj.fromAggregation(pipe);
  if (error) return { error };

  return {
    users: _.take(experts, limit),
    hasMore: experts.length > limit,
  };
};

exports.getLastPostOnObjectFromArea = async ({
  box, skip, limit, app, objectType,
}) => {
  const pipe = await makeLastPostOnAreaPipe({
    box, skip, limit, app, objectType,
  });
  const { wobjects, error } = await Wobj.fromAggregation(pipe);
  if (error) return { error };
  const wobjectsWithCampaigns = await addCampaignsToWobjectsSites(
    { wobjects, app },
  );

  return {
    wobjects: _.take(wobjectsWithCampaigns, limit),
    hasMore: wobjectsWithCampaigns.length > limit,
  };
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

const makeLastPostOnAreaPipe = async ({
  box, skip, limit, app, objectType,
}) => {
  const { crucialWobjects, forSites } = await searchHelper.getAppInfo({ app });
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
        latest_posts: { $exists: true, $type: 'array', $ne: [] },
        object_type: objectType,
        ...(forSites && { author_permlink: { $in: crucialWobjects } }),
      },
    },
    {
      $sort: { activeCampaignsCount: -1, weight: -1 },
    },
    {
      $skip: skip,
    },
    {
      $limit: limit + 1,
    },
    {
      $addFields: { lastPost: { $arrayElemAt: ['$latest_posts', 0] } },
    },
    {
      $lookup: {
        from: 'posts',
        localField: 'lastPost',
        foreignField: '_id',
        as: 'post',
      },
    },
    {
      $addFields: { post: { $arrayElemAt: ['$post', 0] } },
    },
  ];
};
