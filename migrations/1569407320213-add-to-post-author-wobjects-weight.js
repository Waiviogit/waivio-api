
const { Post } = require('database').models;
const { User: UserService } = require('models');
const _ = require('lodash');

const update = async () => {
  const cursor = Post.find().cursor({ batchSize: 1000 });
  let successCount = 0;

  await cursor.eachAsync(async (doc) => {
    const post = doc.toObject();
    const { user, error } = await UserService.getOne(post.author);

    if (error) console.error(error);
    if (_.get(user, 'wobjects_weight')) {
      const res = await Post.updateOne(
        { _id: post._id }, { $set: { author_weight: user.wobjects_weight } },
      );

      if (res.nModified) successCount++;
    }
    if (successCount % 1000 === 0) console.log(successCount);
  });
  return successCount;
};

/**
 * Make any changes you need to make to the database here
 */
exports.up = async function up(done) {
  const successCount = await update();

  console.log(`Updating post finished! ${successCount} posts successfully updated!`);
  done();
};

/**
 * Make any changes that UNDO the up function side effects here (if possible)
 */
exports.down = async function down(done) {
  await Post.update({}, { $unset: { author_weight: '' } });
  done();
};
