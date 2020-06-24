const { User } = require('database').models;
/**
 * Make any changes you need to make to the database here
 */
exports.up = async function up(done) {
  const cursor = User.find().cursor({ batchSize: 1000 });
  const defaultNotifications = {
    account_witness_vote: true,
    activateCampaign: true,
    changePassword: true,
    change_recovery_account: true,
    comment: true,
    custom_json: true,
    fillOrder: true,
    rejectUpdate: true,
    restaurantStatus: true,
    suspendedStatus: true,
    transfer: true,
    transfer_from_savings: true,
    transfer_to_vesting: true,
    withdraw_route: true,
    withdraw_vesting: true,
  };
  await cursor.eachAsync(async (doc) => {
    if (!doc.user_metadata && !doc.user_metadata.settings && !doc.user_metadata.settings.userNotifications) {
      const res = await User.updateOne(
        { name: doc.name }, { $set: { 'user_metadata.settings.userNotifications': defaultNotifications } },
      );

      if (res.nModified) {
        console.log(`User ${doc.name} alias updated!`);
      }
    }
  });
  done();
};

/**
 * Make any changes that UNDO the up function side effects here (if possible)
 */
exports.down = async function down(done) {
  await User.update({}, { $unset: { 'user_metadata.settings.userNotifications': '' } });
  console.log('Deleted field "userNotifications" from all of users!');
  done();
};
