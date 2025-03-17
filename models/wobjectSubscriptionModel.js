const { WobjectSubscriptions } = require('../database').models;

exports.populate = async ({
  condition, select, sort, skip, limit, populate,
}) => {
  try {
    const result = await WobjectSubscriptions
      .find(condition)
      .select(select)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate(populate)
      .lean();
    return { users: result };
  } catch (error) {
    return { error };
  }
};

exports.getFollowersCount = async (following) => {
  try {
    return {
      count: await WobjectSubscriptions.find({ following }).count(),
    };
  } catch (error) {
    return { error };
  }
};

exports.getFollowingsCount = async (follower) => {
  try {
    return {
      count: await WobjectSubscriptions.find({ follower }).count(),
    };
  } catch (error) {
    return { error };
  }
};

exports.getFollowings = async ({ follower }) => {
  try {
    const result = await WobjectSubscriptions.find({ follower }).select('following')
      .lean();
    return { wobjects: result.map((el) => el.following) };
  } catch (error) {
    return { error };
  }
};

exports.getFollowers = async ({ following }) => {
  try {
    const result = await WobjectSubscriptions.find({ following }).select('follower')
      .lean();
    return { wobjFollowers: result.map((el) => el.follower) };
  } catch (error) {
    return { error };
  }
};

exports.findOne = async ({ condition }) => {
  try {
    return { subscription: await WobjectSubscriptions.findOne(condition).lean() };
  } catch (error) {
    return { error };
  }
};
