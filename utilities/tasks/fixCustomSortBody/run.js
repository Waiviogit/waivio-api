const fixCustomSort = require('./fixCustomSort');

(async () => {
  await fixCustomSort();
  process.exit();
})();
