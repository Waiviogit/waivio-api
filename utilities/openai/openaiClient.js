const { OpenAIClient } = require('@langchain/openai');

const client = new OpenAIClient({
  apiKey: process.env.OPENAI_API_KEY,
});

const promptWithJsonSchema = async ({ prompt, jsonSchema }) => {
  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: prompt,
      }],
      response_format: {
        type: 'json_schema',
        json_schema: jsonSchema,
      },
    });

    const result = JSON.parse(response?.choices[0]?.message?.content);
    return { result };
  } catch (error) {
    return { error: error.message };
  }
};

module.exports = {
  promptWithJsonSchema,
};
