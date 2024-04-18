const { OpenAI, OpenAIEmbeddings } = require('@langchain/openai');
const { HNSWLib } = require('@langchain/community/vectorstores/hnswlib');
const { RetrievalQAChain } = require('langchain/chains');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const fsp = require('fs/promises');
const path = require('path');

const txtFilename = 'lib';
const txtPath = path.join(__dirname, `${txtFilename}.txt`);
const VECTOR_STORE_PATH = path.join(__dirname, `${txtFilename}.index`);

const checkCache = async (pathToFile) => {
  try {
    await fsp.access(pathToFile);
    return true;
  } catch (error) {
    return false;
  }
};

const getVectorStore = async () => {
  const cachedVector = await checkCache(VECTOR_STORE_PATH);
  if (cachedVector) {
    // If the vector store file exists, load it into memory
    return HNSWLib.load(VECTOR_STORE_PATH, new OpenAIEmbeddings());
  }
  // If the vector store file doesn't exist, create it
  // Read the input text file
  const text = await fsp.readFile(txtPath, 'utf8');
  // Create a RecursiveCharacterTextSplitter with a specified chunk size
  const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000 });
  // Split the input text into documents
  const docs = await textSplitter.createDocuments([text]);
  // Create a new vector store from the documents using OpenAIEmbeddings
  const vectorStore = await HNSWLib.fromDocuments(docs, new OpenAIEmbeddings());
  // Save the vector store to a file
  await vectorStore.save(VECTOR_STORE_PATH);

  return vectorStore;
};

const runWithEmbeddings = async ({ question, ctx }) => {
  try {
    //  Initialize the OpenAI model
    const model = new OpenAI({
      modelName: 'gpt-4-1106-preview',
    });

    const vectorStore = await getVectorStore();

    // Create a RetrievalQAChain by passing the initialized OpenAI model and the vector store retriever
    const chain = RetrievalQAChain.fromLLM(model, vectorStore.asRetriever());

    // Call the RetrievalQAChain with the input question
    const res = await chain.invoke({ query: question });

    return { result: res.text };
  } catch (error) {
    return { error };
  }
};

module.exports = {
  runWithEmbeddings,
};
