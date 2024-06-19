const { WObject, App } = require('database').models;
const wObjectHelper = require('utilities/helpers/wObjectHelper');
const fsp = require('fs/promises');
const { createNamespace } = require('cls-hooked');
const redis = require('../../redis/redis');

const mapHashtagNames = async () => {
  const session = createNamespace('request-session');
  await redis.setupRedisConnections();
  const app = await App.findOne({ host: 'waivio.com' }).lean();
  const mapNames = {};
  let counter = 0;
  let counter2 = 0;
  const objects = WObject.find({ object_type: 'hashtag' }).lean();

  for await (const object of objects) {
    counter2++;
    const processed = await wObjectHelper.processWobjects({
      wobjects: [object],
      returnArray: false,
      app,
    });
    if (object.author_permlink === processed.name) continue;
    if (!processed.name && object.author_permlink === object.default_name) continue;
    counter++;
    console.log(`${counter} out of ${counter2}`);
    mapNames[object.author_permlink] = processed.name || object.default_name;
    await fsp.writeFile('hashtagNames.json', JSON.stringify(mapNames, null, 2));
  }
};

module.exports = mapHashtagNames;
