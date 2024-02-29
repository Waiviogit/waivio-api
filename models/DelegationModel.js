const { Delegation } = require('database').models;

const find = async ({ filter, projection, options }) => {
  try {
    const result = await Delegation.find(filter, projection, options).lean();
    return { result };
  } catch (error) {
    return { error };
  }
};

const updateOne = async ({ filter, update, options }) => {
  try {
    const result = await Delegation.updateOne(filter, update, options);
    return { result };
  } catch (error) {
    return { error };
  }
};

const createOne = async (delegation) => {
  const { delegator, delegatee } = delegation;
  const { result, error } = await updateOne({
    filter: { delegatee, delegator },
    update: delegation,
    options: { upsert: true },
  });
  return { result, error };
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
  createOne,
  findDelegationsFrom,
  findDelegationsTo,
};
