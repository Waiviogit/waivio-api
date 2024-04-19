/* eslint-disable camelcase */
const fsp = require('fs/promises');
const path = require('path');
const { TTL_TIME, REDIS_KEYS } = require('constants/common');
const { RedisChatMessageHistory } = require('@langchain/redis');
const { ChatPromptTemplate, MessagesPlaceholder } = require('@langchain/core/prompts');
const { RunnablePassthrough, RunnableSequence } = require('@langchain/core/runnables');
const { StringOutputParser } = require('@langchain/core/output_parsers');
const { formatDocumentsAsString } = require('langchain/util/document');
const { OpenAI, OpenAIEmbeddings } = require('@langchain/openai');
const { HNSWLib } = require('@langchain/community/vectorstores/hnswlib');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');

const txtFilename = 'lib';
const txtPath = path.join(__dirname, `${txtFilename}.txt`);
const VECTOR_STORE_PATH = path.join(__dirname, `${txtFilename}.index`);

const contextualizeQSystemPrompt = `Given a chat history and the latest user question
which might reference context in the chat history, formulate a standalone question
which can be understood without the chat history. Do NOT answer the question,
just reformulate it if needed and otherwise return it as is.`;

const contextualizeQPrompt = ChatPromptTemplate.fromMessages([
  ['system', contextualizeQSystemPrompt],
  new MessagesPlaceholder('chat_history'),
  ['human', '{question}'],
]);

const qaSystemPrompt = `You are an assistant for question-answering tasks.
Use the following pieces of retrieved context to answer the question.
If you don't know the answer, just say that you don't know.
Use three sentences maximum and keep the answer concise. Don't use "AI:" in answers

{context}`;

const qaPrompt = ChatPromptTemplate.fromMessages([
  ['system', qaSystemPrompt],
  new MessagesPlaceholder('chat_history'),
  ['human', '{question}'],
]);

const llm = new OpenAI({
  modelName: 'gpt-4-1106-preview',
});

const contextualizeQChain = contextualizeQPrompt
  .pipe(llm)
  .pipe(new StringOutputParser());

const contextualizedQuestion = (input) => {
  if ('chat_history' in input) {
    return contextualizeQChain;
  }
  return input.question;
};

const checkCache = async (pathToCache) => {
  try {
    await fsp.access(pathToCache);
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

const runWithEmbeddings = async ({ question, id }) => {
  try {
    const vectorStore = await getVectorStore();

    const chatHistory = new RedisChatMessageHistory({
      sessionId: `${REDIS_KEYS.API_RES_CACHE}:${REDIS_KEYS.ASSISTANT}:${id}`,
      sessionTTL: TTL_TIME.TEN_MINUTES,
      config: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
      },
    });

    const history = await chatHistory.getMessages();

    const ragChain = RunnableSequence.from([
      RunnablePassthrough.assign({
        context: (input) => {
          if ('chat_history' in input) {
            const chain = contextualizedQuestion(input);
            return chain.pipe(vectorStore.asRetriever()).pipe(formatDocumentsAsString);
          }
          return '';
        },
      }),
      qaPrompt,
      llm,
    ]);
    await chatHistory.addUserMessage(question);

    const aiMsg = await ragChain.invoke({ question, chat_history: history });
    await chatHistory.addAIMessage(aiMsg);

    return { result: aiMsg };
  } catch (error) {
    return { error };
  }
};

module.exports = {
  runWithEmbeddings,
};
