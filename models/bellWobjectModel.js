const { BellWobject } = require('database').models;

exports.findOne = async ({ follower, following }) => {
  try {
    return { bell: await BellWobject.findOne({ following, follower }, { following: 1 }).lean() };
  } catch (error) {
    return { error };
  }
};
