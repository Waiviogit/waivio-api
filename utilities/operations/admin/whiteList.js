const { redis, redisGetter, redisSetter } = require('utilities/redis');
const { WHITE_LIST_KEY } = require('constants/wobjectsData');
const { User } = require('models');

const addWhiteList = async ({ name }) => {
  const result = await redisSetter.saddAsync({
    key: WHITE_LIST_KEY,
    client: redis.processedPostClient,
    values: [name],
  });

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
    sort: { name: 1 },
  });

  return { result: usersData };
};

module.exports = {
  addWhiteList,
  deleteWhiteList,
  getWhiteList,
};
