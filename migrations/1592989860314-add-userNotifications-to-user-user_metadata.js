const { User } = require('database').models;
const _ = require('lodash');
/**
 * Make any changes you need to make to the database here
 */
exports.up = async function up(done) {
  const cursor = User.find().select('+user_metadata').cursor({ batchSize: 1000 });
  const defaultNotifications = {
    activationCampaign: true,
    follow: true,
    fillOrder: true,
    mention: true,
    minimalTransfer: 0,
    reblog: true,
    reply: true,
    'status-change': true,
    transfer: true,
    withdraw_route: true,
    witness_vote: true,
    myPost: false,
    myComment: false,
    myLike: false,
    like: true,
    downvote: false,
    claimReward: false,
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
