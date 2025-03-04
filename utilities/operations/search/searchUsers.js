const { User, App, UserExpertiseModel } = require('../../../models');
const moment = require('moment');
const _ = require('lodash');

const SEARCH_STRATEGY = {
  EXPERTISE: 'EXPERTISE',
  ALL: 'ALL',
};
const LAST_ACTIVITY_DAYS = 180;

const getSearchStrategy = ({ inherited, canBeExtended }) => {
  if (inherited && !canBeExtended) return SEARCH_STRATEGY.EXPERTISE;
  return SEARCH_STRATEGY.ALL;
};

const searchAll = async ({
  string, configuration, skip, limit,
}) => searchUsers({ string, limit, skip });

const searchExpertise = async ({
  string, configuration, skip, limit,
}) => {
  if (!configuration?.defaultHashtag) return { users: [], hasMore: false, error: null };
  const pipeline = [
    {
      $match: {
        author_permlink: configuration.defaultHashtag,
        weight: { $gt: 1 },
        ...(string && { user_name: string }),
      },
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
        localField: 'user_name',
        foreignField: 'name',
        as: 'user',
      },
    },
    {
      $match: {
        'user.lastActivity': { $gte: moment().subtract(LAST_ACTIVITY_DAYS, 'days').toDate() },
      },
    },
    {
      $unwind: {
        path: '$user',
        preserveNullAndEmptyArrays: false,
      },
    },
    {
      $replaceRoot: {
        newRoot: '$user',
      },
    },
    {
      $project: {
        account: '$name',
        wobjects_weight: 1,
        followers_count: 1,
        posting_json_metadata: 1,
      },
    },
  ];

  const { result, error } = await UserExpertiseModel.aggregate(pipeline);

  return {
    users: _.take(result, limit),
    hasMore: result?.length > limit,
    error,
  };
};

const searchProcessor = {
  [SEARCH_STRATEGY.ALL]: searchAll,
  [SEARCH_STRATEGY.EXPERTISE]: searchExpertise,
};

const getSiteUsersByHost = async ({
  host, string, skip, limit,
}) => {
  const { app } = await App.getOne({ host });
  if (!app) return { users: [], hasMore: false, error: null };
  const { configuration, inherited, canBeExtended } = app;
  const strategy = getSearchStrategy({ inherited, canBeExtended });
  const processor = searchProcessor[strategy];

  return processor({
    configuration, string, skip, limit,
  });
};

const makeCountPipeline = ({ string, notGuest }) => {
  const pipeline = [
    { $match: { name: { $in: [new RegExp(`^waivio_${string}`), new RegExp(`^${string}`)] } } },
    { $count: 'count' },
  ];
  if (notGuest) pipeline[0].$match.auth = { $exists: false };
  return pipeline;
};

const searchUsers = async ({
  string, limit, skip, notGuest = false,
}) => {
  if (!string) return getAllUsers({ skip, limit });

  const condition = { name: { $in: [`waivio_${string}`, string] } };
  string = string.replace(/[^a-zA-Z0-9._-]/g, '');
  string = string.replace(/\./g, '\\.');
  if (notGuest) condition.auth = { $exists: false };
  const { user } = await User.findOneByCondition(condition);
  const { users, error } = await User.search({
    string, skip, limit: limit + 1, notGuest,
  });
  const {
    result: [
      { count: usersCount = 0 } = {}] = [], error: countError,
  } = await User.aggregate(makeCountPipeline({ string, notGuest }));
  if (user && users.length) {
    _.remove(users, (person) => user.name === person.name);
    users.splice(0, 0, user);
  }
  return {
    users: _.take(users.map((u) => (
      {
        account: u.name,
        wobjects_weight: u.wobjects_weight,
        followers_count: u.followers_count,
        posting_json_metadata: u.posting_json_metadata,
      })), limit),
    usersCount,
    error: error || countError,
    hasMore: users.length > limit,
  };
};

const getAllUsers = async ({ skip, limit }) => {
  const { usersData: users } = await User.find({
    condition: {},
    sort: { wobjects_weight: -1 },
    limit: limit + 1,
    skip,
    select: { name: 1, followers_count: 1, wobjects_weight: 1 },
  });
  return {
    users: _.take(_.map(users, (u) => (
      {
        account: u.name,
        wobjects_weight: u.wobjects_weight,
        followers_count: u.followers_count,
      })), limit),
    hasMore: users.length > limit,
  };
};

module.exports = {
  searchUsers,
  getSiteUsersByHost,
};
