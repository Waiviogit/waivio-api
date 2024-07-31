const fsp = require('fs/promises');
const path = require('path');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const { OpenAIEmbeddings } = require('@langchain/openai');
const { WeaviateStore } = require('@langchain/weaviate');
const { default: weaviate } = require('weaviate-ts-client');

const up = async () => {
  try {
    const text = await fsp.readFile(path.join(__dirname, 'lib.txt'), 'utf8');
    const text2 = await fsp.readFile(path.join(__dirname, 'lib2.txt'), 'utf8');
    // Create a RecursiveCharacterTextSplitter with a specified chunk size
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 400,
      chunkOverlap: 20,
    });
    // Split the input text into documents
    const docs = await textSplitter.createDocuments([text, text2]);

    const client = weaviate.client({
      scheme: 'http',
      host: process.env.WEAVIATE_CONNECTION_STRING,
    });

    await WeaviateStore.fromDocuments(
      docs,
      new OpenAIEmbeddings(),
      {
        client,
        indexName: process.env.WEAVIATE_ASSISTANT_INDEX,
        textKey: 'pageContent',
      },
    );
    console.log('Vectors Created');
  } catch (error) {
    console.error(error);
  }
};

(async () => {
  await up();
  process.exit();
})();
