const fillTagCategory = require('./fillTagCategory');

(async () => {
  await fillTagCategory(process.argv[2]);
  process.exit();
})();
