
const { User } = require('database').models;

/**
 * Make any changes you need to make to the database here
 */
exports.up = async function up(done) {
  const cursor = User.find().cursor({ batchSize: 1000 });
  const mockMetadata = {
    notifications_last_timestamp: 0,
    bookmarks: [],
    drafts: [],
    settings: {
      exitPageSetting: false,
      locale: 'auto',
      postLocales: [],
      nightmode: false,
      rewardSetting: '50',
      showNSFWPosts: false,
      upvoteSetting: false,
      votePercent: 5000,
      votingPower: false,
    },
  };

  await cursor.eachAsync(async (doc) => {
    if (!doc.user_metadata) {
      const res = await User.updateOne(
        { name: doc.name }, { $set: { user_metadata: mockMetadata } },
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
  await User.update({}, { $unset: { users_metadata: '' } });
  console.log('Deleted field "user_metadata" from all of users!');
  done();
};
