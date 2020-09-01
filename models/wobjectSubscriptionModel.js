const { WobjectSubscriptions } = require('database').models;

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
