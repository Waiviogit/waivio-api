const engineOperations = require('../hiveEngine/engineOperations');
const hiveOperations = require('../hiveApi/hiveOperations');
const { TOKEN_WAIV } = require('../../constants/hiveEngine');
const { Post } = require('../../models');

module.exports = async (
  voteInfo) => {
  const requests = await Promise.all([

    hiveOperations.calcHiveVote({
      userName: voteInfo.voter,
      weight: voteInfo.weight / 100,
      author: voteInfo.author,
      permlink: voteInfo.permlink,
    }),

    engineOperations.calculateHiveEngineVote({
      symbol: TOKEN_WAIV.SYMBOL,
      account: voteInfo.voter,
      poolId: TOKEN_WAIV.POOL_ID,
      weight: voteInfo.weight,
      dieselPoolId: TOKEN_WAIV.DIESEL_POOL_ID,
    }),

    Post.findOneByBothAuthors({
      author: voteInfo.author,
      permlink: voteInfo.permlink,
    }),
  ]);
  const [hive, waiv, getPost] = requests;
  return { hive, waiv, getPost };
};
