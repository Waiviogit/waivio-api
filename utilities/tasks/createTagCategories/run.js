const create = require('./createTagCategories');

(async () => {
  await create();
  process.exit();
})();
