const { wobjRefsClient } = require('utilities/redis/redis');

const getWobjRefs = async (authorPermlink) => {
  const res = await wobjRefsClient.hgetallAsync(authorPermlink);

  return res;
};

module.exports = { getWobjRefs };
