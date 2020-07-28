const _ = require('lodash');
const { User } = require('database').models;
/**
 * Make any changes you need to make to the database here
 */
exports.up = async function up(done) {
  const cursor = User.find({ alias: '' }, { name: 1, posting_json_metadata: 1, json_metadata: 1 }).cursor({ batchSize: 1000 });

  await cursor.eachAsync(async (doc) => {
    let parsedMetadata, parsedPostingMetadata;
    console.log('Start import user: ', doc.name);
    try {
      parsedMetadata = doc.json_metadata
        ? JSON.parse(doc.json_metadata)
        : null;
      parsedPostingMetadata = doc.posting_json_metadata
        ? JSON.parse(doc.posting_json_metadata)
        : null;
    } catch (err) {
      console.error(`Not valid metadata on user ${doc.name}`);
    }
    const postingAlias = _.get(parsedPostingMetadata, 'profile.name', null);
    const alias = _.get(parsedMetadata, 'profile.name', '');
    await User.updateOne({ _id: doc._id }, {
      $set: {
        alias: postingAlias || alias,
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
