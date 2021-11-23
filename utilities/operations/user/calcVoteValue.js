const engineOperations = require('utilities/hiveEngine/engineOperations');
const hiveOperations = require('utilities/hiveApi/hiveOperations');
const { TOKEN_WAIV } = require('constants/hiveEngine');

exports.sliderCalc = async ({
  userName, weight, author, permlink,
}) => {
  const requests = await Promise.all([
    hiveOperations.calcHiveVote({
      userName, weight, author, permlink,
    }),
    engineOperations.calculateHiveEngineVote({
      symbol: TOKEN_WAIV.SYMBOL,
      account: userName,
      poolId: TOKEN_WAIV.POOL_ID,
      dieselPoolId: TOKEN_WAIV.DIESEL_POOL_ID,
      weight: weight * 100,
    }),
  ]);
  const [hive, waiv] = requests;

  return hive.hiveVotePrice + waiv.engineVotePrice;
};

exports.userInfoCalc = async ({ userName }) => {
  const requests = await Promise.all([
    hiveOperations.calcHiveVoteValue({
      userName,
    }),
    engineOperations.calculateHiveEngineVote({
      symbol: TOKEN_WAIV.SYMBOL,
      account: userName,
      poolId: TOKEN_WAIV.POOL_ID,
      dieselPoolId: TOKEN_WAIV.DIESEL_POOL_ID,
      weight: 10000,
    }),
  ]);
  const [hive, waiv] = requests;

  return {
    estimatedHIVE: hive.estimatedHIVE,
    estimatedWAIV: waiv.engineVotePrice,
  };
};
