const { updateUserFollowings } = require('./findUsers');

(async () => {
  await updateUserFollowings(
    {
      startAcc: process.argv[4],
      name: process.argv[3],
      url: process.argv[2],
    },
  );
})();
