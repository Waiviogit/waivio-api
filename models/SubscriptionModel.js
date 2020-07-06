const { Subscriptions } = require('database').models;

exports.followUser = async ({ follower, following }) => {
  const newSubscribe = new Subscriptions({
    follower,
    following,
  });

  try {
    await newSubscribe.save();
    return { result: true };
  } catch (error) {
    return { error };
  }
};

exports.unfollowUser = async ({ follower, following }) => {
  try {
    const result = await Subscriptions.deleteOne({ follower, following });
    if (!result || !result.n) {
      return { result: false };
    }
    return { result: true };
  } catch (error) {
    return { error };
  }
};

exports.findOne = async ({ condition }) => {
  try {
    return { subscription: await Subscriptions.findOne(condition).lean() };
  } catch (error) {
    return { error };
  }
};

exports.getFollowers = async ({ following, skip = 0, limit = 30 }) => {
  try {
    const result = await Subscriptions.find({ following }).skip(skip).limit(limit).select('follower')
      .lean();
    return { users: result.map((el) => el.follower) };
  } catch (error) {
    return { error };
  }
};

exports.getFollowings = async ({ follower, skip = 0, limit = 30 }) => {
  try {
    const result = await Subscriptions.find({ follower }).skip(skip).limit(limit).select('following')
      .lean();
    return { users: result.map((el) => el.following) };
  } catch (error) {
    return { error };
  }
};
