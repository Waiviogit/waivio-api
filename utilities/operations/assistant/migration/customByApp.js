const { App, WObject } = require('database').models;
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

const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 2000,
});

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
  const docs = await textSplitter.createDocuments(textArray);

  await store.addDocuments(docs);
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

const createVectorStoreFromAppObjects = async ({ host, app }) => {
  const indexName = getIndexFromHostName({ host });

  await dropIndex({ indexName });
  const store = getStore({ indexName });
  const asyncIterator = WObject.find({
    'authority.administrative': { $in: [app.owner, ...app.authority] },
    object_type: { $in: ['product', 'list', 'book'] },
  });

  const textArray = [];

  for await (const object of asyncIterator) {
    const processed = await processWobjects({
      wobjects: [object.toObject()],
      fields: REQUIREDFILDS_WOBJ_LIST,
      returnArray: false,
      app,
    });

    const line = `[${processed.name}](https://${host}${processed.defaultShowLink}), [avatar](${processed.avatar}).`;
    textArray.push(line);

    if (textArray.length >= 100) {
      await addDocsToStore({ textArray, store });
      textArray.length = 0;
    }
  }

  if (textArray.length) {
    await addDocsToStore({ textArray, store });
    textArray.length = 0;
  }
};

const checkLock = async ({ userName, host }) => {
  const key = `${REDIS_KEYS.UPDATE_AI_STORE}:${userName}:${host}`;
  const { result: lock } = await redisGetter.getAsync({
    key, client: mainFeedsCacheClient,
  });
  if (lock) {
    const { result: ttl } = await redisGetter.ttlAsync({ key, client: mainFeedsCacheClient });
    const timeToNextRequest = moment.utc().add(ttl, 's').format();
    return { result: false, error: { status: 422, message: `Try again on ${timeToNextRequest}` } };
  }
  await redisSetter.setEx({
    key, value: host, ttl: TTL_TIME.ONE_DAY, client: mainFeedsCacheClient,
  });

  return { result: true, error: null };
};

const updateAiCustomStore = async ({ userName, host }) => {
  const app = await getApp({ host });
  if (userName !== app.owner) return { error: { status: 401, message: 'Not Authorized' } };
  const { result, error } = await checkLock({ userName, host });
  if (error) return { error };

  createVectorStoreFromAppObjects({ app, host });

  return { result };
};

module.exports = {
  updateAiCustomStore,
};
