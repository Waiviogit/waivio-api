const selfPayments = require('./selfPayments');

(async () => {
  await selfPayments();
  process.exit();
})();
