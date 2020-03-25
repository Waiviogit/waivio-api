const { User, WObject } = require('database').models;
const _ = require('lodash');

/**
 * Make any changes you need to make to the database here
 */
exports.up = async function up(done) {
  const cursor = User.find().cursor({ batchSize: 100 });

  await cursor.eachAsync(async (doc) => {
    if (!doc.objects_follow.length) return;
    const result = await WObject.find({ author_permlink: { $in: [doc.objects_follow] } }).lean();
    const existWobjects = _.map(result, (object) => object.author_permlink);
    await User.updateOne({ name: doc.name }, { $set: { objects_follow: existWobjects } });
  });
  done();
};


/**
 * Make any changes that UNDO the up function side effects here (if possible)
 */
exports.down = async (done) => {
  await User.update({}, { stage_version: 0 });
  console.log('Set "stage_version" to 0 for all users!');
  done();
};
