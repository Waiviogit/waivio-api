const change = require('./updateListAvatars');

(async () => {
  await change();
  process.exit();
})();
