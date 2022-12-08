const addUsdRate = require('./addUsdRate');

(async () => {
  await addUsdRate();
  process.exit();
})();
