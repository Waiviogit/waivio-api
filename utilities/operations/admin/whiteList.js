const { redis, redisGetter, redisSetter } = require('utilities/redis');
const { WHITE_LIST_KEY } = require('constants/wobjectsData');
const { User } = require('models');
const moment = require('moment');

const addWhiteList = async ({ name }) => {
  const { user } = await User.getOne(name);
  if (!user) return { error: { status: 401, message: 'Not Found' } };

  const result = await redisSetter.saddAsync({
    key: WHITE_LIST_KEY,
    client: redis.processedPostClient,
    values: [name],
  });

  await User.updateOne({ name }, { whiteListTimestamp: moment.utc() });

  return { result };
};

const deleteWhiteList = async ({ name }) => {
  const result = await redisSetter.sremAsync({
    key: WHITE_LIST_KEY,
    client: redis.processedPostClient,
    value: name,
  });
  return { result };
};

const getWhiteList = async () => {
  const users = await redisGetter.smembersAsync(
    WHITE_LIST_KEY,
    redis.processedPostClient,
  );
  if (!users?.length) return { result: [] };

  const { usersData } = await User.find({
    condition: { name: { $in: users } },
    select: { name: 1, alias: 1, wobjects_weight: 1 },
    sort: { whiteListTimestamp: -1, name: 1 },
  });

  return { result: usersData };
};

module.exports = {
  addWhiteList,
  deleteWhiteList,
  getWhiteList,
};
