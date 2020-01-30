const { User: UserService, Wobj: WobjectService } = require('models');

const getUpdatesSummary = async ({ name, users_count = 3, wobjects_count = 3 }) => {
  const { user, error: getUserError } = await UserService.getOne(name);

  if (getUserError || !user) {
    return { error: getUserError || { status: 404, message: 'User not found!' } };
  }

  // eslint-disable-next-line camelcase
  const { users_updates } = await getUpdatesByUsersList(
    { users_follow: user.users_follow, limit: users_count },
  );

  // eslint-disable-next-line camelcase
  const { wobjects_updates } = await getUpdatesByWobjectsList({
    name: user.name, objects_follow: user.objects_follow, limit: wobjects_count,
  });

  return { result: { users_updates, wobjects_updates } };
};

const getWobjectsUpdates = async ({
  // eslint-disable-next-line camelcase
  name, skip = 0, limit = 3, object_type,
}) => {
  const { user, error: getUserError } = await UserService.getOne(name);

  if (getUserError || !user) {
    return { error: getUserError || { status: 404, message: 'User not found!' } };
  }
  return getUpdatesByWobjectsList({
    name, skip, limit, object_type, objects_follow: user.objects_follow,
  });
};

const getUpdatesByWobjectsList = async ({
  // eslint-disable-next-line camelcase
  objects_follow = [], skip = 0, limit = 3, name, object_type,
}) => {
  let pipeline = [
    // eslint-disable-next-line camelcase
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

  // eslint-disable-next-line camelcase
  if (object_type) {
    // eslint-disable-next-line camelcase
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
  const { user, error: getUserError } = await UserService.getOne(name);

  if (getUserError || !user) {
    return { error: getUserError || { status: 404, message: 'User not found!' } };
  }

  return getUpdatesByUsersList({ users_follow: user.users_follow, skip, limit });
};

const getUpdatesByUsersList = async ({ users_follow = [], limit = 3, skip = 0 }) => {
  const { result = [], error } = await UserService.aggregate([
    { $match: { name: { $in: users_follow } } },
    { $addFields: { priority: { $cond: { if: { $gt: ['$last_posts_count', 0] }, then: 1, else: 0 } } } },
    { $sort: { priority: -1, wobjects_weight: -1 } },
    { $skip: skip },
    { $limit: limit + 1 },
    {
      $project: {
        _id: 0, name: 1, last_posts_count: 1, wobjects_weight: 1,
      },
    },
  ]);

  if (error) return { error };

  return {
    users_updates: {
      users: result.slice(0, limit),
      hasMore: result.length > limit,
    },
  };
};

module.exports = { getUpdatesSummary, getUsersUpdates, getWobjectsUpdates };
