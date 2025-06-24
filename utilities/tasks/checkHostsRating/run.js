const { checkHostsRating } = require('./checkHostsRating');

(async () => {
  await checkHostsRating();
  process.exit();
})();
