const _ = require('lodash');
const { WObject } = require('database').models;
const { User, Subscriptions } = require('models');

const getFollowers = async (data) => {
  try {
    const wObject = await WObject.findOne({ author_permlink: data.author_permlink })
      .populate({
        path: 'followers',
        options: {
          limit: data.limit,
          sort: { name: 1 },
          skip: data.skip,
          select: 'name',
        },
      })
      .lean();

    return { followers: await formatWobjectFollowers(wObject) };
  } catch (error) {
    return { error };
  }
};

const formatWobjectFollowers = async (wObject) => {
  if (!wObject.followers.length) return [];
  const followers = _.map(wObject.followers, 'name');
  const { result } = await User.aggregate([
    { $match: { name: { $in: followers } } },
    { $addFields: { weight: '$wobjects_weight' } },
    { $project: { _id: 0, name: 1, weight: 1 } },
  ]);
  if (result) return result;
  return [];
};

const lightSort = async ({
  limit, skip, select, path, condition, populate, sortData,
}) => {
  const { users } = await Subscriptions.populate({
    limit, skip, select, condition, sort: sortData, populate,
  });
  return _.chain(users)
    .map(`${path}`)
    .compact()
    .value();
};

const hardSort = async ({
  limit, skip, select, path, condition, populate, sortData,
}) => {
  const { users } = await Subscriptions.populate({
    select, condition, populate,
  });
  return _
    .chain(users)
    .map(`${path}`)
    .compact()
    .orderBy([`${sortData}`], 'desc')
    .slice(skip, limit + skip)
    .value();
};

const sortUsers = async ({
  field, name, limit, skip, sort,
}) => {
  let path, select;

  if (field === 'follower') {
    select = 'following';
    path = 'followingPath';
  } else {
    select = 'follower';
    path = 'followerPath';
  }
  const condition = { [`${field}`]: name };
  const populate = { path, select: { wobjects_weight: 1, followers_count: 1 } };

  switch (sort) {
    case 'recency':
      return lightSort({
        select, limit, skip, path, condition, populate, sortData: { _id: -1 },
      });
    case 'alphabet':
      return lightSort({
        select, limit, skip, path, condition, populate, sortData: { [`${select}`]: 1 },
      });
    case 'rank':
      return hardSort({
        limit, skip, select, path, condition, populate, sortData: 'wobjects_weight',
      });
    case 'followers':
      return hardSort({
        limit, skip, select, path, condition, populate, sortData: 'followers_count',
      });
  }
};

module.exports = {
  getFollowers, sortUsers,
};
