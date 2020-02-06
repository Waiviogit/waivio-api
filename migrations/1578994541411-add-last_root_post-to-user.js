const { User } = require('database').models;
const { getAccount } = require('utilities/steemApi/userUtil');
const _ = require('lodash');

/**
 * Make any changes you need to make to the database here
 */
exports.up = async function up(done) {
  let successCount = 0;
  const cursor = User.find().cursor({ batchSize: 1000 });

  await cursor.eachAsync(async (doc) => {
    const steemUser = await getAccount(doc.name);

    if (_.get(steemUser, 'userData.last_root_post')) {
      const res = await User.updateOne(
        { name: doc.name }, { $set: { last_root_post: steemUser.userData.last_root_post } },
      );

      if (res.nModified) {
        successCount++;
        if (successCount % 500 === 0)console.log(`${successCount} user successfully updated!`);
      }
    }
  });
  done();
};

/**
 * Make any changes that UNDO the up function side effects here (if possible)
 */
exports.down = async function down(done) {
  await User.update({}, { $unset: { last_root_post: '' } });
  console.log('Deleted field "last_root_post" from all of users!');
  done();
};
