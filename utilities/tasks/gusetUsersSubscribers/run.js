const { add } = require('./guestFollowers');

(async () => {
  await add();
  process.exit();
})();
