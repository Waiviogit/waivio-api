const { App, WObject } = require('database').models;
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const { OpenAIEmbeddings } = require('@langchain/openai');
const { WeaviateStore } = require('@langchain/weaviate');
const { default: weaviate } = require('weaviate-ts-client');
const { processWobjects } = require('../../../helpers/wObjectHelper');
const { REQUIREDFILDS_WOBJ_LIST } = require('../../../../constants/wobjectsData');
const redis = require('../../../redis/redis');

const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 2000,
});

const INDEX_NAME = 'CleanGirl';

const getApp = async (host) => {
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

const getStore = () => {
  const client = weaviate.client({
    scheme: 'http',
    host: process.env.WEAVIATE_CONNECTION_STRING,
  });

  const store = new WeaviateStore(
    new OpenAIEmbeddings(),
    {
      client,
      indexName: INDEX_NAME,
      textKey: 'pageContent',
    },
  );
  return store;
};

const processAppToStore = async (host) => {
  await redis.setupRedisConnections();
  const app = await getApp(host);
  const store = getStore();
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
  console.log('completed');
  process.exit();
};

const down = async () => {
  try {
    const client = weaviate.client({
      scheme: 'http',
      host: process.env.WEAVIATE_CONNECTION_STRING,
    });

    await client.schema
      .classDeleter()
      .withClassName(INDEX_NAME)
      .do();
  } catch (error) {
    console.error(error);
  }
};

(async () => {
  // await down();
  // await processAppToStore('cleangirllook.com');
  console.log();
})();
