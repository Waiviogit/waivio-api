const { GuestWallet } = require('../database').models;

exports.aggregate = async (pipeline) => {
  try {
    return {
      result: await GuestWallet.aggregate(pipeline),
    };
  } catch (error) {
    return { error };
  }
};

exports.find = async ({
  filter, projection, sort = {}, skip = 0, limit,
}) => {
  try {
    return {
      result: await GuestWallet
        .find(filter, projection)
        .sort(sort)
        .skip(skip)
        .limit(limit),
    };
  } catch (error) {
    return { error };
  }
};
