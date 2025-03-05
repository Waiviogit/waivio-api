/* eslint-disable camelcase */
const {
  User: UserService, Wobj: WobjectService, wobjectSubscriptions,
} = require('../../../models');
const { FOLLOWERS_SORT } = require('../../../constants/sortData');
const { followersHelper } = require('../../helpers');

const getUpdatesSummary = async ({ name, users_count = 3, wobjects_count = 3 }) => {
  const { user, error: getUserError } = await UserService.getOne(name);

  const users = await followersHelper.sortUsers({
    sort: FOLLOWERS_SORT.FOLLOWING_UPDATES,
    collection: FOLLOWERS_SORT.USER_SUB,
    field: FOLLOWERS_SORT.FOLLOWER,
    limit: users_count + 1,
    name,
    skip: 0,
  });

  const { wobjects = [] } = await wobjectSubscriptions.getFollowings({ follower: name });

  if (getUserError || !user) {
    return { error: getUserError || { status: 404, message: 'User not found!' } };
  }

  const users_updates = {
    users: users.slice(0, users_count),
    hasMore: users.length > users_count,
  };

  const { wobjects_updates } = await getUpdatesByWobjectsList({
    name: user.name, objects_follow: wobjects, limit: wobjects_count,
  });

  return { result: { users_updates, wobjects_updates } };
};

const getWobjectsUpdates = async ({
  // eslint-disable-next-line camelcase
  name, skip = 0, limit = 3, object_type,
}) => {
  const { user, error: getUserError } = await UserService.getOne(name);
  const { wobjects = [] } = await wobjectSubscriptions.getFollowings({ follower: name });

  if (getUserError || !user) {
    return { error: getUserError || { status: 404, message: 'User not found!' } };
  }
  return getUpdatesByWobjectsList({
    name, skip, limit, object_type, objects_follow: wobjects,
  });
};

const getUpdatesByWobjectsList = async ({
  objects_follow = [], skip = 0, limit = 3, name, object_type,
}) => {
  let pipeline = [
    { $match: { author_permlink: { $in: [...objects_follow] } } },
    {
      $lookup: {
        from: 'user_wobjects',
        as: 'user_wobject',
        let: { author_permlink: '$author_permlink' },
        pipeline: [
          {
            $match: {
              $and: [
                { $expr: { $eq: ['$author_permlink', '$$author_permlink'] } },
                { $expr: { $eq: ['$user_name', name] } },
              ],
            },
          },
        ],
      },
    },
    { $unwind: { path: '$user_wobject', preserveNullAndEmptyArrays: true } },
    { $addFields: { user_weight: '$user_wobject.weight' } },
    { $addFields: { priority: { $cond: { if: { $gt: ['$last_posts_count', 0] }, then: 1, else: 0 } } } },
    { $sort: { priority: -1, user_weight: -1, _id: -1 } },
    // put here skip/limit params if getting only particular object_type wobjects//
    {
      $project: {
        _id: 0, last_posts_count: 1, author_permlink: 1, user_weight: 1, object_type: 1, fields: 1,
      },
    },
    // cut off this part for getting only specified object type wobjects //
    { $group: { _id: '$object_type', wobjects: { $push: '$$ROOT' } } },
    { $project: { _id: 0, object_type: '$_id', related_wobjects: { $slice: ['$wobjects', limit + 1] } } },
  ];

  if (object_type) {
    pipeline[0].$match.object_type = object_type;
    pipeline = pipeline.slice(0, -2); // cutting off part with group results by object_type
    pipeline.splice(pipeline.length - 1, 0, { $skip: skip }, { $limit: limit + 1 });
    const { wobjects = [] } = await WobjectService.fromAggregation(pipeline);

    return {
      wobjects_updates:
            { related_wobjects: wobjects.slice(0, limit), hasMore: wobjects.length > limit },
    };
  }

  const { wobjects: result = [] } = await WobjectService.fromAggregation(pipeline);

  result.forEach((group) => {
    group.hasMore = group.related_wobjects.length > limit;
    group.related_wobjects = group.related_wobjects.slice(0, limit);
  });
  return { wobjects_updates: result };
};

const getUsersUpdates = async ({ name, skip, limit }) => {
  const users = await followersHelper.sortUsers({
    sort: FOLLOWERS_SORT.FOLLOWING_UPDATES,
    collection: FOLLOWERS_SORT.USER_SUB,
    field: FOLLOWERS_SORT.FOLLOWER,
    limit: limit + 1,
    name,
    skip,
  });

  return {
    users_updates: {
      users: users.slice(0, limit),
      hasMore: users.length > limit,
    },
  };
};

module.exports = { getUpdatesSummary, getUsersUpdates, getWobjectsUpdates };
