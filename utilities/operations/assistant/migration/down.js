const { default: weaviate } = require('weaviate-ts-client');

const down = async () => {
  try {
    const client = weaviate.client({
      scheme: 'http',
      host: process.env.WEAVIATE_CONNECTION_STRING,
    });

    await client.schema
      .classDeleter()
      .withClassName(process.env.WEAVIATE_ASSISTANT_INDEX)
      .do();
  } catch (error) {
    console.error(error);
  }
};

(async () => {
  await down();
  process.exit();
})();
