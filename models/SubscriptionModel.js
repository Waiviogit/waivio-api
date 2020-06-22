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

exports.getGuestFollowersCount = async (userName) => {
  try {
    return {
      count: await Subscriptions.find({
        following: userName,
      }).count(),
    };
  } catch (error) {
    return { error };
  }
};

exports.find = async ({
  condition, skip, limit, sort,
}) => {
  try {
    return {
      subscriptionData: await Subscriptions
        .find(condition)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
    };
  } catch (error) {
    return { error };
  }
};
