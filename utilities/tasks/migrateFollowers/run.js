const { add } = require('./createFollowRecords');

(async () => {
  await add();
  process.exit();
})();
