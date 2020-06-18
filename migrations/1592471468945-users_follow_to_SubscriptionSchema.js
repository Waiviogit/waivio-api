const _ = require('lodash');
const { User, Subscriptions } = require('models');
const { getFollowingsList } = require('utilities/steemApi').userUtil;
/**
 * Make any changes you need to make to the database here
 */
exports.up = async function up(done) {
  const users = await User.find();

  for (const doc of users) {
    let error, followings, guestArray = [], startAccount = '';
    const userArray = [];
    if (!_.get(doc, 'auth.provider', null)) {
      do {
        ({ followings, error } = await getFollowingsList({
          name: doc.name,
          startAccount,
          limit: 1000,
        }));
        if (_.get(error, 'error.message', '') === 'Request Timeout') {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          continue;
        }
        if (error) break;
        startAccount = followings.length ? followings[followings.length - 1] : '';
        userArray.concat(followings);
      } while (!error && followings.length === 1000);
      if (doc.name.match(/^waivio_/) || doc.name.match(/^bxy_/)) {
        guestArray = doc.users_follow;
      }
    } else {
      guestArray = doc.users_follow;
    }
    const resultArray = userArray.length ? [...new Set(userArray)] : guestArray;
    await Promise.all(resultArray.map(async (following) => {
      const { subscription } = await Subscriptions
        .findOne({ conditions: { follower: doc.name, following } });
      if (!subscription) {
        await Subscriptions.followUser({ follower: doc.name, following });
      }
    }));
  }
  done();
};
(async () => {
  await this.up();
})();
/**
 * Make any changes that UNDO the up function side effects here (if possible)
 */
exports.down = async function down(done) {
  done();
};
