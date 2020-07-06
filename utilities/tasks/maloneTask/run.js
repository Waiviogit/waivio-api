const { add } = require('./addMissedUsers');

(async () => {
  await add();
  process.exit();
})();
