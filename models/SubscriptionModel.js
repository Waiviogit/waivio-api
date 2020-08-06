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

exports.getFollowers = async ({
  following, skip = 0, limit = 30, withId = false,
}) => {
  try {
    const result = await Subscriptions.find({ following }).skip(skip).limit(limit).select('follower')
      .lean();
    if (withId) {
      return { users: result };
    }
    return { users: result.map((el) => el.follower) };
  } catch (error) {
    return { error };
  }
};

exports.getFollowings = async ({
  follower, skip = 0, limit = 30, withId = false,
}) => {
  try {
    const result = await Subscriptions.find({ follower }).skip(skip).limit(limit).select('following')
      .lean();
    if (withId) {
      return { users: result };
    }
    return { users: result.map((el) => el.following) };
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

exports.getGuestSubscriptionsCount = async (userName, flag) => {
  try {
    const query = flag ? {
      follower: { $in: [/waivio_/, /bxy_/] },
      following: userName,
    } : {
      following: { $in: [/waivio_/, /bxy_/] },
      follower: userName,
    };
    return {
      count: await Subscriptions.find(query).count(),
    };
  } catch (error) {
    return { error };
  }
};

exports.getFollowingsCount = async (userName) => {
  try {
    return {
      count: await Subscriptions.find({ follower: userName }).count(),
    };
  } catch (error) {
    return { error };
  }
};
