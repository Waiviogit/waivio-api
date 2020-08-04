const { BellNotifications } = require('database').models;

const findOne = async ({ follower, following }) => {
  try {
    return { bell: await BellNotifications.findOne({ following, follower }).select('following').lean() };
  } catch (error) {
    return { error };
  }
};

module.exports = { findOne };
