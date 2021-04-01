const { UserWobjects, User } = require('models');
const wObjectModel = require('models/wObjectModel');
const _ = require('lodash');
const { redisSetter, redisGetter } = require('utilities/redis');

const getWobjExperts = async ({
  // eslint-disable-next-line camelcase
  author_permlink, skip = 0, limit = 30, user,
}) => {
  let userExpert;

  const { error: err } = await wObjectModel.findOne(author_permlink);
  if (err) return { err };

  if (user) {
    const { experts, error } = await UserWobjects.getByWobject({
      authorPermlink: author_permlink, username: user,
    });
    if (error) return { error };
    userExpert = _.get(experts, '[0]');
  }
  const { experts, error } = await UserWobjects.getByWobject({
    authorPermlink: author_permlink, skip, limit, weight: true,
  });
  if (error) return { error };
  const { result, error: getFollowersErr } = await getFollowersCount({ experts, userExpert });
  if (getFollowersErr) return { error: getFollowersErr };
  return { experts: result, userExpert };
};

const getFollowersCount = async ({ experts, userExpert }) => {
  const { usersData, error } = await User.find({
    condition: { name: { $in: _.compact([..._.map(experts, 'name'), _.get(userExpert, 'name')]) } },
    select: { name: 1, followers_count: 1 },
  });
  if (error) return { error };
  if (userExpert) {
    const expert = _.find(usersData, (el) => el.name === userExpert.name);
    userExpert.followers_count = _.get(expert, 'followers_count', 0);
  }
  return {
    result: _.forEach(experts, (el) => {
      const user = _.find(usersData, (obj) => obj.name === el.name);
      el.followers_count = _.get(user, 'followers_count', 0);
    }),
  };
};

/** cache wobject top users for fast request work */
const cacheAllObjectExperts = async (limit) => {
  const hashtags = await wObjectModel.find(
    { weight: { $gt: 0 }, object_type: 'hashtag' },
    { author_permlink: 1, _id: 1 }, { weight: -1 }, 0, limit,
  );
  const objects = await wObjectModel.find(
    { weight: { $gt: 0 }, object_type: { $ne: 'hashtag' } },
    { author_permlink: 1, _id: 1 }, { weight: -1 }, 0, limit,
  );

  for (const wobj of _.concat(hashtags, objects)) {
    await redisGetter.removeTopWobjUsers(wobj.author_permlink);
    const { result: userWobjects } = await UserWobjects.find(
      { author_permlink: wobj.author_permlink }, { weight: -1 }, 5,
    );
    const ids = _.map(userWobjects, (user) => `${user.user_name}:${user.weight}`);
    if (ids && ids.length) {
      await redisSetter.addTopWobjUsers(wobj.author_permlink, ids);
    }
  }
};

module.exports = { getWobjExperts, cacheAllObjectExperts };
