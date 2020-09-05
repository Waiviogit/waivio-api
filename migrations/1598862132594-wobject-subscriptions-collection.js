const { WobjectSubscriptions, User } = require('database').models;

/**
 * Make any changes you need to make to the database here
 */
exports.up = async function up(done) {
  const cursor = User
    .find({ objects_follow: { $ne: [] } })
    .select({ name: 1, objects_follow: 1 }).lean().cursor({ batchSize: 100 });
  await cursor.eachAsync(async (doc) => {
    for (const following of doc.objects_follow) {
      try {
        const newSubscription = new WobjectSubscriptions({ follower: doc.name, following });
        await newSubscription.save();
      } catch (e) {
        console.error(e.message);
      }
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
