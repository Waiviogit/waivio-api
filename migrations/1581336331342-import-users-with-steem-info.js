const { User } = require('database').models;
const { importSteemUserOps } = require('utilities/operations/user');
const { redisSetter } = require('utilities/redis');

/**
 * Make any changes you need to make to the database here
 */
exports.up = async function up(done) {
  const cursor = User.find().cursor({ batchSize: 100 });

  await cursor.eachAsync(async (doc) => {
    const { user, error } = await importSteemUserOps.importUser(doc.name);

    if (error) {
      await redisSetter.setImportedUserError(doc.name, JSON.stringify(error));
    } else if (user) {
      console.log(`User ${doc.name} successfully imported with STEEM info!`);
    }
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
