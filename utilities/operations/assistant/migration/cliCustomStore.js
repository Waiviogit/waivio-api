const { App } = require('../../../../models');
const { createVectorStoreFromAppObjects } = require('./customByApp');

(async () => {
  const host = process.argv[2];
  if (!host) process.exit();
  const { app } = await App.getOne({ host });
  if (!app) {
    console.log('app not found');
    process.exit();
  }
  await createVectorStoreFromAppObjects({ host, app });
  process.exit();
})();
