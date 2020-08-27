const _ = require('lodash');
const { User, Subscriptions } = require('models');

const getFollowers = async (data) => {
  const { usersData: followers } = await User.find({
    condition: { objects_follow: data.author_permlink },
    select: { _id: 0, name: 1, wobjects_weight: 1 },
    sort: { wobjects_weight: -1 },
    skip: data.skip,
    limit: data.limit,
  });
  return {
    followers: _.map(followers,
      (follower) => ({ name: follower.name, weight: follower.wobjects_weight })),
  };
};

const sortBeforePopulate = async ({
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

const sortAfterPopulate = async ({
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
    case 'alphabet':
      return sortBeforePopulate({
        select, limit, skip, path, condition, populate, sortData: sort === 'recency' ? { _id: -1 } : { [`${select}`]: 1 },
      });
    case 'rank':
    case 'followers':
      return sortAfterPopulate({
        limit, skip, select, path, condition, populate, sortData: sort === 'rank' ? 'wobjects_weight' : 'followers_count',
      });
  }
};

module.exports = {
  getFollowers, sortUsers,
};
