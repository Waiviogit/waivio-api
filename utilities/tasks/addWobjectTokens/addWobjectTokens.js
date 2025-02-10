const { WobjectTokens } = require('database').models;
const _ = require('lodash');
const { getTokens } = require('../../hiveEngine/tokensContract');
const { getRewardPools } = require('../../hiveEngine/commentContract');

const createToken = async (data) => {
  try {
    await WobjectTokens.create(data);
  } catch (error) {

  }
};

const cryptoTags = [
  'hive-173575',
  'hive-124838',
  'hive-104024',
  'hive-129017',
  'hive-110490',
  'hive-13323',
  'hive-engine',
  'tribaldex',
  'dieselpools',
  'outposts',
  'tribes',
  'hive-101690',
  'oneup',
  'thgaming',
  'splinterlands',
  'woo',
  'bitcoin',
  'finance',
  'someeofficial',
  'neoxian',
  'palnet',
  'playgamer',
  'pgm',
  'vyb',
  'pob',
  'proofofbrain',
  'hive-150329',
  'hive-184309',
  'cryptoshots',
  'proofofbrain',
  'dtube',
  'play2earn',
  'slothbuzz',
  'hive-155986',
  'hive-179927',
  'sbt',
  'splinterlandsbattle',
  'hive-176363',
  'blocktunes',
  'btunes',
  'bzb',
  'thiagorewards',
  'web3rewards',
  'hive-168543',
  'airhawk',
  'airhawk-exchange',
  'airhawk-project',
  'golem',
  'golemgo',
  'golemoverlord',
  'hive-186610',
  'hive-188262',
  'inleo',
  'drip',
  'hive-117752',
  'ctp',
  'clicktrackprofit',
];

const addWobjectTokens = async () => {
  let offset = 0;

  for (const record of cryptoTags.map((v) => ({ author_permlink: v }))) {
    await createToken(record);
  }

  while (true) {
    const result = await getTokens({
      method: 'find',
      query: {},
      offset,
      limit: 1000,
    });
    if (!result?.length) break;
    offset += result?.length ?? 0;

    const writeData = result
      .map((v) => ({ author_permlink: v.symbol.toLocaleLowerCase() }))
      .filter((v) => !['waivio', 'waiv'].includes(v.author_permlink));

    for (const record of writeData) {
      await createToken(record);
    }
  }
};

module.exports = addWobjectTokens;
