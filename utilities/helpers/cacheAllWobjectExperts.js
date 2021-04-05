const { redisSetter, redisGetter } = require('utilities/redis');
const { UserWobjects } = require('models');
const wObjectModel = require('models/wObjectModel');
const _ = require('lodash');

/** cache wobject top users for fast request work */
const cacheAllWobjectExperts = async (limit) => {
  const { result: hashtags } = await wObjectModel.find(
    { weight: { $gt: 0 }, object_type: 'hashtag' },
    { author_permlink: 1, _id: 1 }, { weight: -1 }, 0, limit,
  );
  const { result: objects } = await wObjectModel.find(
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

module.exports = { cacheAllWobjectExperts };
