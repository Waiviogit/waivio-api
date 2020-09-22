const { Subscriptions, BellNotifications } = require('database').models;

module.exports = async () => {
  const subscriptions = await BellNotifications.find().lean();
  for (const subscription of subscriptions) {
    await Subscriptions.updateOne({
      follower: subscription.follower,
      following: subscription.following,
    }, { bell: true });
  }
};
