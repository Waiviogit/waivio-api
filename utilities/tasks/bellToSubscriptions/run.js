const bellToSubscriptions = require('./bellToSubscriptions');

(async () => {
  await bellToSubscriptions();
  process.exit();
})();
