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

exports.getFollowings = async ({ follower, skip = 0, limit = 30 }) => {
  try {
    const result = await Subscriptions.find({ follower }).lean();
    return { users: result.map((el) => el.following).slice(skip, limit) };
  } catch (error) {
    return { error };
  }
};
