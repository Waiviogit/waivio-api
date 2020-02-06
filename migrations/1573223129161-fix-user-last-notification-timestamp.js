
const { User } = require('database').models;

/**
 * Make any changes you need to make to the database here
 */
exports.up = async (done) => {
  try {
    const res = await User.updateMany(
      { 'user_metadata.notifications_last_timestamp': null },
      { $set: { 'user_metadata.notifications_last_timestamp': 0 } },
    );

    console.log(res);
  } catch (error) {
    console.error(error);
  }
  done();
};

/**
 * Make any changes that UNDO the up function side effects here (if possible)
 */
exports.down = async (done) => {
  done();
};
