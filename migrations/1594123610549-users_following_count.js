const { User, Subscriptions } = require('database').models;

exports.up = async function up(done) {
  const cursor = User.find({ users_following_count: 0 }).cursor({ batchSize: 1000 });

  await cursor.eachAsync(async (doc) => {
    const followings = await Subscriptions.find({ follower: doc.name }).count();
    await User.updateOne({ _id: doc._id }, { $set: { users_following_count: followings } });
  });
  done();
};

/**
 * Make any changes that UNDO the up function side effects here (if possible)
 */
exports.down = function down(done) {
  done();
};
