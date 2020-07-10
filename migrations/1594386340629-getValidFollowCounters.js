const _ = require('lodash');
const { getFollowCount } = require('utilities/steemApi/userUtil');
const { User } = require('database').models;
const { Subscriptions: subscriptionsModel } = require('models');

exports.up = async function up(done) {
  const cursor = User.find({}, { name: 1 }).cursor({ batchSize: 1000 });

  await cursor.eachAsync(async (doc) => {
    console.log('Start import user: ', doc.name);
    const { result } = await getFollowCount(doc.name);
    if (!result || result.error) return;
    const { count: followings } = await subscriptionsModel.getGuestSubscriptionsCount(doc.name, false);
    const { count: followers } = await subscriptionsModel.getGuestSubscriptionsCount(doc.name, true);
    await User.updateOne({ _id: doc._id }, {
      $set: {
        users_following_count: _.get(result, 'following_count', 0) + followings,
        followers_count: _.get(result, 'follower_count', 0) + followers,
      },
    });
  });
  done();
};

/**
 * Make any changes that UNDO the up function side effects here (if possible)
 */
exports.down = function down(done) {
  done();
};
