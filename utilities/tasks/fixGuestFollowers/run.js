const { add } = require('./addFollowers');

(async () => {
  await add();
  process.exit();
})();
