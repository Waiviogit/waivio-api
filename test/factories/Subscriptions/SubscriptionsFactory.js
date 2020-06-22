const { Subscriptions, faker } = require('test/testHelper');

const Create = async ({
  follower, following, onlyData,
} = {}) => {
  const subscriptionData = {
    follower: follower || faker.name.firstName(),
    following: following || faker.name.firstName(),
  };
  if (onlyData) return subscriptionData;
  const subscription = new Subscriptions(subscriptionData);
  await subscription.save();
  subscription.toObject();

  return subscription;
};

module.exports = { Create };
