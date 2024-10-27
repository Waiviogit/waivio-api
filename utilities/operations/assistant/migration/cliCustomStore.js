const { App } = require('models');
const { createVectorStoreFromAppObjects } = require('./customByApp');
const redis = require('../../../redis/redis');

(async () => {
  const host = process.argv[2];
  if (!host) process.exit();
  await redis.setupRedisConnections();
  const { app } = await App.getOne({ host });
  if (!app) {
    console.log('app not found');
    process.exit();
  }
  await createVectorStoreFromAppObjects({ host, app });
  process.exit();
})();
