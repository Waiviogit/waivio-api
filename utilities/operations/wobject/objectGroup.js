const _ = require('lodash');
const moment = require('moment');
const wObjectHelper = require('../../helpers/wObjectHelper');
const {
  Wobj, Subscriptions, UserExpertiseModel, User,
} = require('../../../models');
const { FIELDS_NAMES, OBJECT_TYPES } = require('../../../constants/wobjectsData');
const jsonHelper = require('../../helpers/jsonHelper');

const USER_PROJECTION = {
  _id: 1,
  name: 1,
  alias: 1,
  last_posts_count: 1,
  followers_count: 1,
  wobjects_weight: 1,
  last_root_post: 1,
};

const GROUP_FIELDS = [
  FIELDS_NAMES.GROUP_EXCLUDE,
  FIELDS_NAMES.GROUP_ADD,
  FIELDS_NAMES.GROUP_FOLLOWERS,
  FIELDS_NAMES.GROUP_FOLLOWING,
  FIELDS_NAMES.GROUP_EXPERTISE,
  FIELDS_NAMES.GROUP_LAST_ACTIVITY,
  FIELDS_NAMES.GROUP_MIN_EXPERTISE,
];

/**
 * Helper function to build pagination condition for cursor-based pagination.
 */
const buildPaginationCondition = (cursor, sortFields, conditionField = 'user.') => {
  if (!cursor || !sortFields.length) return {};

  const conditions = [];
  for (let i = 0; i < sortFields.length; i++) {
    const { field } = sortFields[i];
    const { order } = sortFields[i];

    const operator = order === 1 ? '$gt' : '$lt';

    const condition = {};
    // Equal conditions for all previous fields
    for (let j = 0; j < i; j++) {
      const prevField = sortFields[j].field;
      condition[`${conditionField}${prevField}`] = cursor[prevField];
    }
    // Comparison condition for the current field
    condition[`${conditionField}${field}`] = { [operator]: cursor[field] };

    conditions.push(condition);
  }

  return { $or: conditions };
};

/**
 * Fetch users by expertise (links) with sorting and lastActivity filtering.
 */
const getByExpertise = async ({
  links = [], limit, cursor, exclude = [], lastActivityFilter, sortFields, minExpertiseFilter,
}) => {
  if (!links.length) return [];

  const matchConditions = {
    author_permlink: { $in: links },
  };

  const paginationCondition = buildPaginationCondition(cursor, sortFields);

  const pipe = [
    { $match: matchConditions },
    {
      $group: {
        _id: '$user_name',
        totalWeight: { $sum: '$weight' },
      },
    },
  ];

  if (exclude.length) {
    pipe.push({
      $match: { _id: { $nin: exclude } },
    });
  }
  pipe.push(...[
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: 'name',
        as: 'user',
      },
    },
    { $unwind: '$user' }]);

  if (lastActivityFilter) {
    pipe.push({ $match: { 'user.last_root_post': lastActivityFilter } });
  }
  if (minExpertiseFilter) {
    pipe.push({ $match: { 'user.wobjects_weight': minExpertiseFilter } });
  }
  if (Object.keys(paginationCondition).length) {
    pipe.push({ $match: paginationCondition });
  }

  pipe.push(...[
    {
      $sort: sortFields.reduce((acc, field) => {
        acc[`user.${field.field}`] = field.order;
        return acc;
      }, {}),
    },
    { $limit: limit },
    {
      $replaceRoot: {
        newRoot: '$user',
      },
    },
    {
      $project: USER_PROJECTION,
    },
  ]);

  const { result, error } = await UserExpertiseModel.aggregate(pipe);
  if (error) {
    console.error('Error in getByExpertise:', error);
    return [];
  }

  return result;
};

/**
 * Fetch users by followers/following with sorting and lastActivity filtering.
 */
const getByFollowers = async ({
  names = [],
  limit,
  cursor,
  follower = true,
  exclude = [],
  lastActivityFilter,
  sortFields,
  minExpertiseFilter,
}) => {
  if (!names.length) return [];

  const matchCondition = follower ? 'follower' : 'following';
  const localField = follower ? 'following' : 'follower';

  const paginationCondition = buildPaginationCondition(cursor, sortFields);

  const pipe = [
    {
      $match: {
        [matchCondition]: { $in: names },
        ...(exclude.length && { [localField]: { $nin: exclude } }),
      },
    },
    {
      $lookup: {
        from: 'users',
        localField,
        foreignField: 'name',
        as: 'user',
      },
    },
    { $unwind: '$user' },
  ];
  if (lastActivityFilter) {
    pipe.push({ $match: { 'user.last_root_post': lastActivityFilter } });
  }
  if (minExpertiseFilter) {
    pipe.push({ $match: { 'user.wobjects_weight': minExpertiseFilter } });
  }
  if (Object.keys(paginationCondition).length) {
    pipe.push({ $match: paginationCondition });
  }

  pipe.push(...[
    {
      $sort: sortFields.reduce((acc, field) => {
        acc[`user.${field.field}`] = field.order;
        return acc;
      }, {}),
    },
    { $limit: limit },
    {
      $replaceRoot: {
        newRoot: '$user',
      },
    },
    {
      $project: USER_PROJECTION,
    },
  ]);

  const { result, error } = await Subscriptions.aggregate(pipe);
  if (error) {
    console.error('Error in getByFollowers:', error);
    return [];
  }
  return result;
};

/**
 * Fetch additional users by namesAdd with sorting and lastActivity filtering.
 */
const getAdditionalUsers = async ({
  names = [], limit, cursor, exclude = [], lastActivityFilter, sortFields, minExpertiseFilter,
}) => {
  if (!names.length) return [];

  const matchConditions = {
    name: {
      $in: names,
      ...(exclude.length && { $nin: exclude }),
    },
    ...(lastActivityFilter && { last_root_post: lastActivityFilter }),
    ...(minExpertiseFilter && { wobjects_weight: minExpertiseFilter }),
  };

  const paginationCondition = buildPaginationCondition(cursor, sortFields, '');

  const pipe = [
    { $match: matchConditions },
  ];
  if (Object.keys(paginationCondition).length) {
    pipe.push({ $match: paginationCondition });
  }
  pipe.push(...[{
    $sort: sortFields.reduce((acc, field) => {
      acc[field.field] = field.order;
      return acc;
    }, {}),
  },
  { $limit: limit },
  {
    $project: USER_PROJECTION,
  },
  ]);

  const { result, error } = await User.aggregate(pipe);
  if (error) {
    console.error('Error in getAdditionalUsers:', error);
    return [];
  }
  return result;
};

const getLastActivityFilter = (activity) => {
  if (!activity) return null;
  const num = Number(activity);
  if (Number.isNaN(num)) return null;
  return { $gte: moment().subtract(num, 'ms').toISOString().split('.')[0] };
};

const getMinExpertiseFilter = (expertise) => {
  if (!expertise) return null;
  const num = Number(expertise);
  if (Number.isNaN(num)) return null;
  return { $gte: num };
};

/**
 * Main function to get users based on various criteria.
 */
const getObjectGroup = async ({
  authorPermlink,
  app,
  limit = 10,
  cursor,
  sortFields = [
    { field: 'wobjects_weight', order: -1 },
    { field: 'name', order: 1 },
  ],
}) => {
  const { wObject, error } = await Wobj.getOne(authorPermlink, OBJECT_TYPES.GROUP);
  if (error) return { error };

  const processed = await wObjectHelper.processWobjects({
    wobjects: [wObject],
    app,
    returnArray: false,
    fields: GROUP_FIELDS,
  });

  const followers = jsonHelper.parseJson(processed[FIELDS_NAMES.GROUP_FOLLOWERS], []);
  const following = jsonHelper.parseJson(processed[FIELDS_NAMES.GROUP_FOLLOWING], []);
  const links = jsonHelper.parseJson(processed[FIELDS_NAMES.GROUP_EXPERTISE], []);
  const exclude = processed[FIELDS_NAMES.GROUP_EXCLUDE] || [];
  const namesAdd = processed[FIELDS_NAMES.GROUP_ADD] || [];

  if (!followers.length && !following.length && !links.length && !namesAdd.length) {
    return { result: [], hasMore: false, nextCursor: null };
  }

  const lastActivityFilter = getLastActivityFilter(processed[FIELDS_NAMES.GROUP_LAST_ACTIVITY]);
  const minExpertiseFilter = getMinExpertiseFilter(processed[FIELDS_NAMES.GROUP_MIN_EXPERTISE]);

  const commonParams = {
    limit, cursor, sortFields, lastActivityFilter, minExpertiseFilter, exclude,
  };

  // Fetch users based on different criteria in parallel
  const dbRequests = await Promise.all([
    getAdditionalUsers({ names: namesAdd, ...commonParams }),
    getByFollowers({ names: followers, follower: false, ...commonParams }),
    getByFollowers({ names: following, follower: true, ...commonParams }),
    getByExpertise({ links, ...commonParams }),
  ]);

  // Combine and deduplicate users
  const combinedUsers = _.unionBy(...dbRequests, 'name');

  const fields = sortFields.map((el) => el.field);
  const order = sortFields.map((el) => (el.order === 1 ? 'asc' : 'desc'));
  const sorted = _.orderBy(combinedUsers, fields, order);

  const resultUsers = sorted.slice(0, limit);
  const hasMore = combinedUsers.length >= limit;

  // Prepare the cursor for the next page
  let nextCursor = null;
  if (hasMore) {
    const lastUser = resultUsers[resultUsers.length - 1];
    nextCursor = sortFields.reduce((acc, field) => {
      acc[field.field] = lastUser[field.field];
      return acc;
    }, {});
  }

  return {
    result: resultUsers,
    hasMore,
    nextCursor,
  };
};

module.exports = {
  getObjectGroup,
};
