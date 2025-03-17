const postDraftsToCollection = require('./postDraftsToCollection');

(async () => {
  await postDraftsToCollection();
  process.exit();
})();
