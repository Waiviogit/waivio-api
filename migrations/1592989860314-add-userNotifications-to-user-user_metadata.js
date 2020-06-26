const { User } = require('database').models;
const _ = require('lodash');
/**
 * Make any changes you need to make to the database here
 */
exports.up = async function up(done) {
  const cursor = User.find().select('+user_metadata').cursor({ batchSize: 1000 });
  const defaultNotifications = {
    activationCampaign: true,
    changePassword: true,
    change_recovery_account: true,
    follow: true,
    fillOrder: true,
    mention: true,
    minimalTransfer: 0.001,
    power_down: true,
    reblog: true,
    reply: true,
    rejectUpdate: true,
    'status-change': true,
    suspendedStatus: true,
    transfer: true,
    transfer_from_savings: true,
    transfer_to_vesting: true,
    withdraw_route: true,
    witness_vote: true,
  };
  await cursor.eachAsync(async (doc) => {
    if (_.get(doc, 'user_metadata.settings') && _.isEmpty(doc.user_metadata.settings.userNotifications)) {
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
