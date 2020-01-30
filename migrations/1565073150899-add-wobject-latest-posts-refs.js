
const { WObject, Post } = require('database').models;
const { WOBJECT_LATEST_POSTS_COUNT } = require('utilities/constants');
/**
 * Make any changes you need to make to the database here
 */

exports.up = async function up(done) {
  const cursor = WObject.find().cursor({ batchSize: 1000 });

  await cursor.eachAsync(async (doc) => {
    const postsArray = await Post
      .find({ 'wobjects.author_permlink': doc.author_permlink })
      .sort({ _id: -1 })
      .limit(WOBJECT_LATEST_POSTS_COUNT);
    const idsArray = postsArray.map((p) => p._id);
    const res = await WObject.updateOne({ _id: doc._id }, { $set: { latest_posts: idsArray } });

    if (res.nModified) {
      console.log(`Wobject ${doc.author_permlink} updated! Add ${idsArray.length} posts refs!`);
    }
  });
  done();
};
/**
 * Make any changes that UNDO the up function side effects here (if possible)
 */
exports.down = async function down(done) {
  await WObject.update({}, { $unset: { latest_posts: '' } });
  console.log('Deleted field "latest_posts" from all of users!');
  done();
};
