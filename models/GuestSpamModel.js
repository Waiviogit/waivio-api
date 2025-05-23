const { GuestSpam: GuestSpamModel } = require('../database').models;

const find = async ({ filter, projection, options }) => {
  try {
    const result = await GuestSpamModel.find(filter, projection, options).lean();

    return {
      result,
    };
  } catch (error) {
    return { error };
  }
};

module.exports = {
  find,
};
