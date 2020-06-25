const _ = require('lodash');
const { User } = require('database').models;
const { Subscriptions } = require('models');
const { getFollowingsList } = require('utilities/steemApi').userUtil;
/**
 * Make any changes you need to make to the database here
 */
const writeToCollection = async ({ array, doc }) => {
  if (array.length) {
    await Promise.all(_.map(array, async (el) => {
      const { subscription } = await Subscriptions
        .findOne({ condition: { follower: doc.name, following: el } });
      if (!subscription) {
        const { result, error: dbError } = await Subscriptions
          .followUser({ follower: doc.name, following: el });
        result && console.log(`success, ${doc.name} follows ${el}`);
        dbError && console.error(dbError);
      }
    }));
  }
};

exports.up = async function up(done) {
  const cursor = await User.find({ stage_version: 1 }, {}, { timeout: true }).cursor({ batchSize: 100 });

  await cursor.eachAsync(async (doc) => {
    let error, followings, startAccount = '';
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
        await writeToCollection({
          array: _.map(followings, (el) => el.following),
          doc,
        });
      } while (!error && followings.length === 1000);
    } else {
      await writeToCollection({
        array: doc.users_follow,
        doc,
      });
    }
    await User.updateOne({ _id: doc._id }, { $set: { stage_version: 0 } });
  });
  done();
};

/**
 * Make any changes that UNDO the up function side effects here (if possible)
 */
exports.down = async function down(done) {
  done();
};
