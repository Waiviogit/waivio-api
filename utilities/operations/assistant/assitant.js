/* eslint-disable camelcase */
const { TTL_TIME, REDIS_KEYS } = require('constants/common');
const { RedisChatMessageHistory } = require('@langchain/redis');
const { ChatPromptTemplate, MessagesPlaceholder } = require('@langchain/core/prompts');
const { RunnablePassthrough, RunnableSequence } = require('@langchain/core/runnables');
const { StringOutputParser } = require('@langchain/core/output_parsers');
const { formatDocumentsAsString } = require('langchain/util/document');
const { OpenAI, OpenAIEmbeddings } = require('@langchain/openai');
const crypto = require('node:crypto');
const { WeaviateStore } = require('@langchain/weaviate');
const { default: weaviate } = require('weaviate-ts-client');

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

let vStore = null;

const getVStore = async () => {
  if (vStore) return vStore;

  const client = weaviate.client({
    scheme: 'http',
    host: process.env.WEAVIATE_CONNECTION_STRING,
  });

  // Create a store for an existing index
  vStore = await WeaviateStore.fromExistingIndex(new OpenAIEmbeddings(), {
    client,
    indexName: process.env.WEAVIATE_ASSISTANT_INDEX,
    textKey: 'pageContent',
  });

  return vStore;
};

const runWithEmbeddings = async ({ question, id }) => {
  try {
    const vectorStore = await getVStore();

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

const getHistory = async ({ id }) => {
  try {
    const chatHistory = new RedisChatMessageHistory({
      sessionId: `${REDIS_KEYS.API_RES_CACHE}:${REDIS_KEYS.ASSISTANT}:${id}`,
      sessionTTL: TTL_TIME.TEN_MINUTES,
      config: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
      },
    });

    const history = await chatHistory.getMessages();

    const result = history.map((el) => ({
      id: crypto.randomUUID(),
      text: el?.content,
      role: el._getType(),
    }));

    return { result };
  } catch (error) {
    return { error };
  }
};

module.exports = {
  runWithEmbeddings,
  getHistory,
};
