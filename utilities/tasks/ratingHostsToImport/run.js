const { ratingHostsToImport } = require('./ratingHostsToImport');

(async () => {
  await ratingHostsToImport(process.argv[2]);
  process.exit();
})();
