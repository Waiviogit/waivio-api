const _ = require('lodash');
const { redisSetter, redisGetter } = require('../redis');
const { UserExpertiseModel, Wobj } = require('../../models');

/** cache wobject top users for fast request work */
exports.cacheAllWobjectExperts = async (limit) => {
  const { result: hashtags } = await Wobj.find(
    { weight: { $gt: 0 }, object_type: 'hashtag' },
    { author_permlink: 1, _id: 1 },
    { weight: -1 },
    0,
    limit,
  );
  const { result: objects } = await Wobj.find(
    { weight: { $gt: 0 }, object_type: { $ne: 'hashtag' } },
    { author_permlink: 1, _id: 1 },
    { weight: -1 },
    0,
    limit,
  );

  for (const wobj of _.concat(hashtags, objects)) {
    await redisGetter.removeTopWobjUsers(wobj.author_permlink);
    const { result: userWobjects } = await UserExpertiseModel
      .find({ author_permlink: wobj.author_permlink }, { weight: -1 }, 5);
    const ids = _.map(userWobjects, (user) => `${user.user_name}:${user.weight}`);
    if (ids && ids.length) {
      await redisSetter.addTopWobjUsers(wobj.author_permlink, ids);
    }
  }
};
