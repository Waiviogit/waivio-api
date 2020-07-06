const { Subscriptions, User } = require('database').models;
const { importUser } = require('utilities/operations/user/importSteemUserOps');

exports.add = async () => {
  const followers = await Subscriptions.find({ follower: 'marcusmalone' }).lean();

  for (const follower of followers) {
    const user = await User.findOne({ name: follower.following.toString() });
    if (user) continue;
    const { user: update, error } = await importUser(follower.following);
    if (update) console.log(`user ${follower.following} successfully updated`);
    if (error) console.error(error.message);
  }
};
