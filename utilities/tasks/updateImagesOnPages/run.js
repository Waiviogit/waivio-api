const { updateImagesOnPages } = require('./updateImagesOnPages');

(async () => {
  await updateImagesOnPages();
  process.exit();
})();
