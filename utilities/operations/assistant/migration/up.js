const fsp = require('fs/promises');
const path = require('path');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const { OpenAIEmbeddings } = require('@langchain/openai');
const { Chroma } = require('@langchain/community/vectorstores/chroma');

const txtFilename = 'lib';
const txtPath = path.join(__dirname, `${txtFilename}.txt`);

const up = async () => {
  try {
    const text = await fsp.readFile(txtPath, 'utf8');
    // Create a RecursiveCharacterTextSplitter with a specified chunk size
    const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000 });
    // Split the input text into documents
    const docs = await textSplitter.createDocuments([text]);

    await Chroma.fromDocuments(docs, new OpenAIEmbeddings(), {
      collectionName: process.env.CHROMA_ASSISTANT_COLLECTION,
      url: process.env.CHROMA_CONNECTION_STRING,
      collectionMetadata: {
        'hnsw:space': 'cosine',
      },
    });

    console.log('Vectors Created');
  } catch (error) {
    console.error(error);
  }
};

(async () => {
  await up();
  process.exit();
})();
