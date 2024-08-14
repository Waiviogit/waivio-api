const wObjectHelper = require('utilities/helpers/wObjectHelper');
const {
  Wobj, Subscriptions, UserWobjects, User,
} = require('models');
const { FIELDS_NAMES, OBJECT_TYPES } = require('constants/wobjectsData');
const jsonHelper = require('utilities/helpers/jsonHelper');
const _ = require('lodash');

const getByExpertise = async ({
  links = [], limit, lastName = '', exclude,
}) => {
  if (!links?.length) return [];

  const secondMatchCondition = {
    $match: {
      links: { $all: links },
      ...(lastName && { _id: { $gt: lastName } }),
      ...(exclude?.length && { _id: { $nin: exclude } }),
    },
  };

  // To handle the case where both `lastName` and `exclude` exist
  if (lastName && exclude?.length) {
    secondMatchCondition.$match._id = {
      $gt: lastName,
      $nin: exclude,
    };
  }

  const pipe = [
    {
      $match: {
        author_permlink: { $in: links },
      },
    },
    {
      $group: {
        _id: '$user_name',
        weight: { $sum: '$weight' },
        links: {
          $push: '$author_permlink',
        },
      },
    },
    secondMatchCondition,
    {
      $sort: { _id: 1 },
    },
    {
      $limit: limit,
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
        _id: 1,
        name: 1,
        last_posts_count: 1,
        followers_count: 1,
        wobjects_weight: 1,
      },
    },
  ];

  const { result, error } = await UserWobjects.aggregate(pipe);
  if (error) return [];
  return result;
};

const getByFollowers = async ({
  names = [], limit, lastName = '', follower = true, exclude,
}) => {
  if (!names?.length) return [];
  const matchCondition = follower ? 'follower' : 'following';
  const localField = follower ? 'following' : 'follower';

  //
  const pipe = [
    {
      $match: {
        [matchCondition]: { $in: names },
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
  ];

  // Conditionally add $match stage if lastName is provided
  if (lastName) {
    pipe.push({
      $match: {
        name: { $gt: lastName },
      },
    });
  }
  if (exclude?.length) {
    pipe.push({
      $match: {
        name: { $nin: exclude },
      },
    });
  }

  // Add the remaining stages
  pipe.push(
    {
      $sort: {
        name: 1,
        // wobjects_weight: -1, _id: -1,
      },
    },
    {
      $limit: limit,
    },
    {
      $project: {
        _id: 1,
        name: 1,
        last_posts_count: 1,
        followers_count: 1,
        wobjects_weight: 1,
      },
    },
  );

  const { result, error } = await Subscriptions.aggregate(pipe);
  if (error) return [];
  return result;
};

const getAdditionalUsers = async ({ names, lastName }) => {
  if (!names?.length) return [];
  const pipe = [
    {
      $match: { name: { $in: names } },
    },
  ];

  if (lastName) {
    pipe.push({
      $match: {
        name: { $gt: lastName },
      },
    });
  }

  pipe.push(
    {
      $sort: {
        name: 1,
        // wobjects_weight: -1, _id: -1,
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        last_posts_count: 1,
        followers_count: 1,
        wobjects_weight: 1,
      },
    },
  );

  const { result, error } = await User.aggregate(pipe);
  if (error) return [];
  return result;
};

const getObjectGroup = async ({
  authorPermlink, app, limit = 10, lastName,
}) => {
  const { wObject, error } = await Wobj.getOne(authorPermlink, OBJECT_TYPES.GROUP);
  if (error) return { error };
  const processed = await wObjectHelper.processWobjects({
    wobjects: [wObject],
    app,
    returnArray: false,
    fields: [
      FIELDS_NAMES.GROUP_EXCLUDE,
      FIELDS_NAMES.GROUP_ADD,
      FIELDS_NAMES.GROUP_FOLLOWERS,
      FIELDS_NAMES.GROUP_FOLLOWING,
      FIELDS_NAMES.GROUP_EXPERTISE,
    ],
  });

  const followers = jsonHelper.parseJson(processed[FIELDS_NAMES.GROUP_FOLLOWERS], []);
  const following = jsonHelper.parseJson(processed[FIELDS_NAMES.GROUP_FOLLOWING], []);
  const links = jsonHelper.parseJson(processed[FIELDS_NAMES.GROUP_EXPERTISE], []);

  const exclude = processed[FIELDS_NAMES.GROUP_EXCLUDE] || [];
  const namesAdd = processed[FIELDS_NAMES.GROUP_ADD] || [];

  const responses = await Promise.all([
    getAdditionalUsers({ names: namesAdd, lastName }),
    getByFollowers({
      names: followers, limit, lastName, follower: false,
    }),
    getByFollowers({
      names: following, limit, lastName, follower: true,
    }),
    getByExpertise({
      links, lastName, exclude, limit,
    }),
  ]);

  const orderedList = _.chain(responses)
    .flatten()
    .uniqBy('name')
    .orderBy(['name'], ['asc'])
    .value();

  return {
    result: _.take(orderedList, limit),
    hasMore: orderedList.length > limit,
  };
};

module.exports = {
  getObjectGroup,
};
