const { User } = require('database').models;
const { userUtil } = require('utilities/steemApi');
const _ = require('lodash');

/**
 * Make any changes you need to make to the database here
 */
exports.up = async function up(done) {
  const cursor = User.find().cursor({ batchSize: 100 });

  await cursor.eachAsync(async (doc) => {
    const result = await userUtil.getAccount(doc.name);
    if (_.get(result, 'userData.posting_json_metadata')) {
      await User.updateOne(
        { name: doc.name },
        { $set: { posting_json_metadata: result.userData.posting_json_metadata } },
      );
      console.log(`Updated user ${doc.name}`);
    } else {
      console.error(`Error for user ${doc.name}`);
    }
  });
  done();
  done();
};

/**
 * Make any changes that UNDO the up function side effects here (if possible)
 */
exports.down = async function down(done) {
  await User.update({}, { $unset: 'posting_json_metadata' });
  console.log('Set "stage_version" to 0 for all users!');
  done();
};
