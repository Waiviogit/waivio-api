const { Delegation } = require('../database').models;

const find = async ({ filter, projection, options }) => {
  try {
    const result = await Delegation.find(filter, projection, options).lean();
    return { result };
  } catch (error) {
    return { error };
  }
};

const findDelegationsFrom = async (delegator) => {
  const { result } = await find({
    filter: { delegator },
  });

  return result || [];
};

const findDelegationsTo = async (delegatee) => {
  const { result } = await find({
    filter: { delegatee },
  });

  return result || [];
};

module.exports = {
  findDelegationsFrom,
  findDelegationsTo,
};
