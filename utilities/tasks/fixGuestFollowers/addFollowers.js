const _ = require('lodash');
const { User } = require('database').models;
const { Subscriptions } = require('models');

exports.add = async () => {
  const guests = await User.find({ name: { $in: [/waivio_/, /bxy_/] } });

  for (const guest of guests) {
    for (const follow of guest.users_follow) {
      await Subscriptions.followUser({ follower: guest.name, following: follow });
    }
  }
};
