const { App, WObject } = require('database').models;
const mongoose = require('database').Mongoose;
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const { OpenAIEmbeddings } = require('@langchain/openai');
const { WeaviateStore } = require('@langchain/weaviate');
const { default: weaviate } = require('weaviate-ts-client');
const moment = require('moment');
const { processWobjects } = require('../../../helpers/wObjectHelper');
const { REQUIREDFILDS_WOBJ_LIST } = require('../../../../constants/wobjectsData');
const redisGetter = require('../../../redis/redisGetter');
const redisSetter = require('../../../redis/redisSetter');
const { REDIS_KEYS, TTL_TIME } = require('../../../../constants/common');
const { mainFeedsCacheClient } = require('../../../redis/redis');
const { getCollectionName } = require('../../../helpers/namesHelper');

const OBJECTS_LIMIT = 50000;

const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 2000,
});

const checkLock = async ({
  host,
}) => {
  const key = `${REDIS_KEYS.UPDATE_AI_STORE}:${host}`;
  const { result: lock } = await redisGetter.getAsync({
    key,
    client: mainFeedsCacheClient,
  });
  if (lock) {
    const { result: ttl } = await redisGetter.ttlAsync({
      key,
      client: mainFeedsCacheClient,
    });

    return {
      result: false,
      timeToNextRequest: moment.utc().add(ttl, 's').valueOf(),
    };
  }
  await redisSetter.setEx({
    key,
    value: host,
    ttl: TTL_TIME.ONE_DAY,
    client: mainFeedsCacheClient,
  });

  return {
    result: true,
  };
};

const releaseLock = async ({
  userName,
  host,
}) => {
  const key = `${REDIS_KEYS.UPDATE_AI_STORE}:${userName}:${host}`;
  await redisSetter.deleteKey({
    key,
    client: mainFeedsCacheClient,
  });
};

const getIndexFromHostName = ({ host }) => {
  const cleanedHostName = host.replace(/[^a-zA-Z0-9]/g, '');
  return cleanedHostName.charAt(0).toUpperCase() + cleanedHostName.slice(1).toLowerCase();
};

const getApp = async ({ host }) => {
  try {
    const result = await App.findOne({ host }).lean();
    return result;
  } catch (error) {
    return null;
  }
};

const addDocsToStore = async ({ store, textArray }) => {
  try {
    const docs = await textSplitter.createDocuments(textArray);
    await store.addDocuments(docs);
  } catch (error) {
    console.log(error.message);
  }
};

const getStore = ({ indexName }) => {
  const client = weaviate.client({
    scheme: 'http',
    host: process.env.WEAVIATE_CONNECTION_STRING,
  });

  return new WeaviateStore(
    new OpenAIEmbeddings(),
    { client, indexName, textKey: 'pageContent' },
  );
};

const dropIndex = async ({ indexName }) => {
  try {
    const client = weaviate.client({
      scheme: 'http',
      host: process.env.WEAVIATE_CONNECTION_STRING,
    });

    await client.schema
      .classDeleter()
      .withClassName(indexName)
      .do();
  } catch (error) {
    console.error(error);
  }
};

const getObject = async (object) => {
  try {
    const result = await WObject.findOne({ author_permlink: object.author_permlink }).lean();
    return result;
  } catch (error) {
    return null;
  }
};

const getCursor = async ({ host }) => {
  try {
    const listCollections = await mongoose.connection.useDb('waivio')
      .listCollections();
    const collectionName = getCollectionName({ host });
    const collection = listCollections.find((el) => el.name === collectionName);
    if (!collection) return null;

    const model = await mongoose.connection.useDb('waivio')
      .collection(collection.name);

    return model.find().limit(OBJECTS_LIMIT);
  } catch (error) {
    return null;
  }
};

const getLine = ({ processed, host }) => {
  let line = `[${processed.name}](https://${host}${processed.defaultShowLink}), ![avatar](${processed.avatar}), ${processed.object_type}.`;
  if (['business', 'restaurant'].includes(processed.object_type) && processed.address) {
    line += processed.address;
  }
  return line;
};

const unsetAdvancedAI = async ({ host }) => {
  try {
    return await App.updateOne({ host }, { 'configuration?.advancedAI': false });
  } catch (error) {
    return null;
  }
};

const createVectorStoreFromAppObjects = async ({ host, app }) => {
  const indexName = getIndexFromHostName({ host });

  await dropIndex({ indexName });
  const store = getStore({ indexName });

  const asyncIterator = await getCursor({ host });
  if (!asyncIterator) {
    await releaseLock({ userName: app.owner, host });
    await unsetAdvancedAI({ host });
    console.log('[INFO] no iterator found');
    return;
  }
  console.log(`[INFO] START CREATE VECTORS FOR ${host}`);

  const textArray = [];

  for await (const object of asyncIterator) {
    const objectFromDb = await getObject(object);
    if (!objectFromDb) continue;

    const processed = await processWobjects({
      wobjects: [objectFromDb],
      fields: REQUIREDFILDS_WOBJ_LIST,
      returnArray: false,
      app,
    });
    textArray.push(getLine({ processed, host }));
    if (textArray.length >= 100) {
      await addDocsToStore({ textArray, store });
      textArray.length = 0;
    }
  }

  if (textArray.length) {
    await addDocsToStore({ textArray, store });
    textArray.length = 0;
  }
  console.log(`[INFO] FINISH CREATE VECTORS FOR ${host}`);
};

const updateAiCustomStore = async ({ userName, host }) => {
  const app = await getApp({ host });
  if (![app?.owner, ...(app.admins ?? [])].includes(userName)) return { error: { status: 401, message: 'Not Authorized' } };
  const { result, timeToNextRequest } = await checkLock({ host });
  if (!result) return { result, timeToNextRequest };
  createVectorStoreFromAppObjects({ app, host });

  return { result, timeToNextRequest: moment.utc().add(1, 'd').valueOf() };
};

module.exports = {
  updateAiCustomStore,
  createVectorStoreFromAppObjects,
};
