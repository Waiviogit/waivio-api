const _ = require('lodash');
const { User } = require('database').models;
const { User: userModel, Subscriptions } = require('models');

exports.add = async () => {
  const guestUsers = await User.find({ name: { $in: [new RegExp('waivio_'), new RegExp('bxy_')] } }, { name: 1 }).lean();
  for (const guest of guestUsers) {
    const { users, error } = await userModel.getFollowers({ name: guest.name });
    error && console.error(error);
    if (users.length) {
      _.forEach(users, async (el) => {
        const { subscription } = await Subscriptions
          .findOne({ condition: { follower: el.name, following: guest.name } });
        if (!subscription) {
          const { result, error: dbError } = await Subscriptions
            .followUser({ follower: el.name, following: guest.name });
          result && console.log(`success, ${el.name} follows ${guest.name}`);
          dbError && console.error(dbError);
        }
      });
    }
  }
};
