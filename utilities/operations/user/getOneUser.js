const { User, UserWobjects } = require('database').models;
const { userUtil: userSteemUtil } = require('utilities/steemApi');
const { startImportUser } = require('utilities/operations/user/importSteemUserBalancer');
const { Subscriptions, mutedUserModel } = require('models');
const _ = require('lodash');

const makeCountPipeline = (name) => {
  const pipeline = [
    { $match: { user_name: name, weight: { $gt: 0 } } },
    {
      $lookup: {
        from: 'wobjects',
        localField: 'author_permlink',
        foreignField: 'author_permlink',
        as: 'wobject',
      },
    },
    { $unwind: '$wobject' },
    {
      $facet: {
        hashtagsCount: [
          { $match: { 'wobject.object_type': 'hashtag' } },
          { $count: 'hashtagsCount' },
        ],
        wobjectsCount: [
          { $match: { 'wobject.object_type': { $ne: 'hashtag' } } },
          { $count: 'wobjectsCount' },
        ],
      },
    },
    {
      $project: {
        hashtagsExpCount: { $arrayElemAt: ['$hashtagsCount.hashtagsCount', 0] },
        wobjectsExpCount: { $arrayElemAt: ['$wobjectsCount.wobjectsCount', 0] },
      },
    },
  ];

  return pipeline;
};

const getDbUser = async (name) => {
  try {
    const user = await User
      .findOne({ name })
      .populate('objects_shares_count');
    return user ? { user: user.toJSON() } : {};
  } catch (error) {
    return { error };
  }
};

const getOne = async ({
  name, with_followings: withFollowings, app, userName,
}) => {
  const { userData = {} } = await userSteemUtil.getAccount(name);
  // eslint-disable-next-line prefer-const
  let { user, error: dbError } = await getDbUser(name);// get user data from db
  if (dbError) return { error: dbError };

  if (!user) {
    // If user not exist in DB and STEEM -> return error,
    // else if user exist in steem but not in DB -> invoke import user operation
    if (_.isEmpty(userData)) {
      return { error: dbError || { status: 404, message: `User ${name} not found!` } };
    }
    const importResult = await startImportUser(name);
    if (_.get(importResult, 'result.ok')) console.log(`Started import user ${name}!`);
    return { userData };
  }

  if (_.get(user, 'auth.provider')) user.provider = user.auth.provider;
  if (withFollowings) {
    const { users } = await Subscriptions.getFollowings({ follower: name, limit: 0 });
    user.users_follow = users || [];
  } else user = _.omit(user, ['users_follow', 'objects_follow']);

  const [counters] = await UserWobjects.aggregate(makeCountPipeline(userData.name));

  const { result: mutedUsers } = await mutedUserModel.find({
    condition:
      { $or: [{ userName: user.name, mutedForApps: _.get(app, 'host') }, { mutedBy: userName, userName: user.name }] },
  });

  return {
    userData: Object.assign(userData, user, counters, {
      muted: !_.isEmpty(mutedUsers),
      mutedByModerator: !!_.reduce(mutedUsers, (acc, ell) => { if (_.includes(ell.mutedForApps, _.get(app, 'host'))) return true; }, false),
    }),
  };
};

module.exports = getOne;
