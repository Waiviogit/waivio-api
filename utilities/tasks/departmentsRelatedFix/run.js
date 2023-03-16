const departmentsRelatedFix = require('./departmentsRelatedFix');

(async () => {
  await departmentsRelatedFix();
  process.exit();
})();
