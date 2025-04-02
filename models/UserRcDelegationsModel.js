const { UserRcDelegations } = require('../database').models;

const find = async ({ filter, projection, options }) => {
  try {
    const result = await UserRcDelegations.find(filter, projection, options).lean();
    return { result };
  } catch (error) {
    return { error };
  }
};

const findIncomingDelegations = async ({ delegatee, skip = 0, limit = 1000 }) => {
  const { result = [] } = await find({
    filter: { delegatee },
    options: {
      skip,
      limit,
      sort: { _id: -1 },
    },
  });

  return result;
};

module.exports = {
  findIncomingDelegations,
};
