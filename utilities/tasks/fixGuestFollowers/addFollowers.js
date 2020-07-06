const _ = require('lodash');
const { User } = require('database').models;
const { Subscriptions } = require('models');

exports.add = async () => {
  const guests = await User.find({ users_follow: { $in: [/waivio_/, /bxy_/] } });

  for (const guest of guests) {
    const follows = _.filter(guest.users_follow, (flw) => flw.match(/waivio_/) || flw.match(/bxy_/));
    for (const follow of follows) {
      await Subscriptions.followUser({ follower: guest.name, following: follow });
    }
  }
};
