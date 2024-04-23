const { OpenAIEmbeddings } = require('@langchain/openai');
const { Chroma } = require('@langchain/community/vectorstores/chroma');

const down = async () => {
  try {
    const embeddings = new OpenAIEmbeddings();
    const vectorStore = new Chroma(embeddings, {
      collectionName: process.env.CHROMA_ASSISTANT_COLLECTION,
      url: process.env.CHROMA_CONNECTION_STRING,
    });

    await vectorStore.delete({ filter: {} });
    console.log('Vectors Deleted');
  } catch (error) {
    console.error(error);
  }
};

(async () => {
  await down();
  process.exit();
})();
