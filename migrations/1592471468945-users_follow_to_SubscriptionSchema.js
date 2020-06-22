const _ = require('lodash');
const { User } = require('database').models;
const { Subscriptions } = require('models');
const { getFollowingsList } = require('utilities/steemApi').userUtil;
/**
 * Make any changes you need to make to the database here
 */
exports.up = async function up(done) {
  const cursor = await User.find().cursor({ batchSize: 1000 });

  await cursor.eachAsync(async (doc) => {
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
        startAccount = followings.length ? followings[followings.length - 1].following : '';
        // eslint-disable-next-line no-loop-func
        userArray.push(...followings.map((element) => element.following));
      } while (!error && followings.length === 1000);
    } else {
      guestArray = doc.users_follow;
    }
    const resultArray = userArray.length ? [...new Set(userArray)] : guestArray;
    if (resultArray.length) {
      await Promise.all(resultArray.map(async (following) => {
        const { subscription } = await Subscriptions
          .findOne({ conditions: { follower: doc.name, following } });
        if (!subscription) {
          const { result, error: dbError } = await Subscriptions
            .followUser({ follower: doc.name, following });
          result && console.log(`success, ${doc.name} follows ${following}`);
          dbError && console.error(dbError);
        }
      }));
    }
  });
  done();
};

/**
 * Make any changes that UNDO the up function side effects here (if possible)
 */
exports.down = async function down(done) {
  done();
};
