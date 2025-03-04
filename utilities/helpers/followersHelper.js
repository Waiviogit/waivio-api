const _ = require('lodash');
const { FOLLOWERS_SORT, SORT_CONDITION } = require('../../constants/sortData');
const { User, Subscriptions, wobjectSubscriptions } = require('../../models');

const getFollowers = async (data) => {
  const { wobjFollowers = [] } = await wobjectSubscriptions
    .getFollowers({ following: data.author_permlink });
  const { usersData: followers } = await User.find({
    condition: { name: { $in: wobjFollowers } },
    select: { _id: 0, name: 1, wobjects_weight: 1 },
    sort: { wobjects_weight: -1 },
    skip: data.skip,
    limit: data.limit,
  });
  return {
    followers: _.map(
      followers,
      (follower) => ({ name: follower.name, weight: follower.wobjects_weight }),
    ),
  };
};

const sortBeforePopulate = async ({
  limit, skip, select, path, condition, populate, sortData, collection,
}) => {
  let users = [];
  switch (collection) {
    case FOLLOWERS_SORT.USER_SUB:
      ({ users } = await Subscriptions.populate({
        limit, skip, select, condition, sort: sortData, populate,
      }));
      break;
    case FOLLOWERS_SORT.WOBJECT_SUB:
      ({ users } = await wobjectSubscriptions.populate({
        limit, skip, select, condition, sort: sortData, populate,
      }));
      break;
  }

  return _.chain(users)
    .map(`${path}`)
    .compact()
    .value();
};

const sortAfterPopulate = async ({
  limit, skip, select, path, condition, populate, sortData, collection,
}) => {
  let users = [];
  switch (collection) {
    case FOLLOWERS_SORT.USER_SUB:
      ({ users } = await Subscriptions.populate({
        select, condition, populate,
      }));
      break;
    case FOLLOWERS_SORT.WOBJECT_SUB:
      ({ users } = await wobjectSubscriptions.populate({
        select, condition, populate,
      }));
      break;
  }
  return _
    .chain(users)
    .map(`${path}`)
    .compact()
    .orderBy(sortData.sort, sortData.order)
    .slice(skip, limit + skip)
    .value();
};

const sortUsers = async ({
  field, name, limit, skip, sort, collection,
}) => {
  let path, select;

  if (field === FOLLOWERS_SORT.FOLLOWER) {
    select = FOLLOWERS_SORT.FOLLOWING;
    path = FOLLOWERS_SORT.FOLLOWING_PATH;
  } else {
    select = FOLLOWERS_SORT.FOLLOWER;
    path = FOLLOWERS_SORT.FOLLOWER_PATH;
  }
  const condition = { [`${field}`]: name };
  const populate = {
    path, select: { wobjects_weight: 1, followers_count: 1, last_posts_count: 1 },
  };

  switch (sort) {
    case FOLLOWERS_SORT.RECENCY:
    case FOLLOWERS_SORT.ALPHABET:
      return sortBeforePopulate({
        select, limit, skip, path, condition, populate, sortData: sort === FOLLOWERS_SORT.RECENCY ? { _id: -1 } : { [`${select}`]: 1 }, collection,
      });
    case FOLLOWERS_SORT.RANK:
    case FOLLOWERS_SORT.FOLLOWERS:
    case FOLLOWERS_SORT.FOLLOWING_UPDATES:
      return sortAfterPopulate({
        limit, skip, select, path, condition, populate, sortData: SORT_CONDITION[sort], collection,
      });
  }
};

module.exports = {
  getFollowers, sortUsers,
};
