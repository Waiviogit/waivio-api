const { findFollowersCountAndUpdate } = require('./updateFollowers');

(async () => {
  await findFollowersCountAndUpdate();
  process.exit();
})();
