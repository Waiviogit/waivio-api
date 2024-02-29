const addDelegations = require('./addDelegations');

(async () => {
  await addDelegations();
  process.exit();
})();
