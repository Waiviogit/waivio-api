const change = require('./changeLinks');

(async () => {
  await change();
  process.exit();
})();
