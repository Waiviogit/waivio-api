
const { Post, WObject: Wobj } = require('../database').models;

/**
 * Make any changes you need to make to the database here
 */
exports.up = async function up(done) {
  try {
    const wobjects = await Wobj.aggregate([{ $project: { _id: 0, author_permlink: 1 } }]);

    for (const authorPermlink of wobjects.map((w) => w.author_permlink)) {
      const countPosts = await Post.countDocuments({ 'wobjects.author_permlink': authorPermlink });

      await Wobj.updateOne({ authorPermlink }, { $set: { countPosts } });

      console.log(`${authorPermlink} wobject with ${countPosts} posts updated!`);
    }
  } catch (error) {
    console.error(error);
    return;
  }
  done();
};
/**
 * Make any changes that UNDO the up function side effects here (if possible)
 */
exports.down = async function down(done) {
  await Wobj.update({}, { $unset: { count_posts: '' } });
  done();
};
