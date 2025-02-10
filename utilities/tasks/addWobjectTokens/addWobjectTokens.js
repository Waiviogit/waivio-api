const { WobjectTokens } = require('database').models;
const { getTokens } = require('../../hiveEngine/tokensContract');

const createToken = async (data) => {
  try {
    await WobjectTokens.create(data);
  } catch (error) {

  }
};

const addWobjectTokens = async () => {
  let offset = 0;
  while (true) {
    const result = await getTokens({
      method: 'find',
      query: {},
      offset,
      limit: 1000,
    });
    if (!result?.length) break;
    offset += result?.length ?? 0;
    const writeData = result.map((v) => ({ author_permlink: v.symbol.toLocaleLowerCase() }));

    for (const record of writeData) {
      await createToken(record);
    }
  }
};

module.exports = addWobjectTokens;
