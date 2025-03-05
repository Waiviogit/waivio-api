const _ = require('lodash');
const engineOperations = require('../../hiveEngine/engineOperations');
const hiveOperations = require('../../hiveApi/hiveOperations');
const postsUtil = require('../../hiveApi/postsUtil');
const { TOKEN_WAIV } = require('../../../constants/hiveEngine');
const jsonHelper = require('../../helpers/jsonHelper');
const {
  Post, Comment, Wobj, UserExpertiseModel,
} = require('../../../models');
const { redisGetter } = require('../../redis');
const { WHITE_LIST_KEY, VOTE_COST } = require('../../../constants/wobjectsData');
const { roundToEven } = require('../../helpers/calcHelper');
const userUtil = require('../../hiveApi/userUtil');
const commentContract = require('../../hiveEngine/commentContract');
const tokensContract = require('../../hiveEngine/tokensContract');

const MAX_REJECT_WEIGHT = 9999;

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
    await Post.findOneByBothAuthors({ author, permlink }),
  ]);

  const [hive, waiv, postDb] = requests;

  const hasRewards = await checkPostForRewards({ postDb, author, permlink });

  return hasRewards
    ? hive.hiveVotePrice + waiv.engineVotePrice
    : hive.hiveVotePrice;
};

const includesPostRewards = (post) => {
  const jsonMetadata = jsonHelper.parseJson(_.get(post, 'json_metadata', ''));
  if (_.isEmpty(jsonMetadata)) return false;
  return _.some(
    TOKEN_WAIV.TAGS,
    (tag) => _.includes(_.get(jsonMetadata, 'tags', []), tag),
  );
};

const checkPostForRewards = async ({ postDb, author, permlink }) => {
  if (_.has(postDb, 'error')) return false;
  const post = _.get(postDb, 'post');
  if (!post) {
    let { post: comment } = await postsUtil.getPost({ author, permlink });
    if (!comment) {
      ({ comment } = Comment.getOne({ author, permlink }));
      if (!comment) return false;
    }
    const { post: rootPost } = await Post.findOneByBothAuthors({
      author: comment.root_author,
      permlink: comment.root_permlink,
    });
    if (!rootPost) return false;
    return includesPostRewards(rootPost);
  }
  return includesPostRewards(post);
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

exports.waivVoteUSD = async ({ userName, weight }) => {
  const { engineVotePrice } = await engineOperations.calculateHiveEngineVote({
    symbol: TOKEN_WAIV.SYMBOL,
    account: userName,
    poolId: TOKEN_WAIV.POOL_ID,
    dieselPoolId: TOKEN_WAIV.DIESEL_POOL_ID,
    weight: weight * 100,
  });

  return {
    result: engineVotePrice,
  };
};

exports.checkUserWhiteList = async ({
  userName,
}) => {
  const result = await redisGetter.sismember({
    key: WHITE_LIST_KEY,
    member: userName,
  });
  const amountUsd = result ? VOTE_COST.FOR_WHITE_LIST : VOTE_COST.USUAL;
  const amount = await engineOperations.usdToWaiv({ amountUsd });

  const minWeight = await engineOperations.getWeightToVote({
    amount,
    symbol: TOKEN_WAIV.SYMBOL,
    account: userName,
    maxVoteWeight: 10000,
    poolId: TOKEN_WAIV.POOL_ID,
  });

  return {
    result: !!result,
    minWeight: Math.min(roundToEven(minWeight) + 20, 10000),
  };
};

const getWeightFromObjectExpertise = async ({
  userName, authorPermlink,
}) => {
  const { result, error } = await UserExpertiseModel.findOne({
    user_name: userName,
    author_permlink: authorPermlink,
  });
  if (error) return 1;
  if (!result) return 1;

  return result.weight ? result.weight : 1;
};

const checkEvenAndAddOne = (num) => {
  const integer = parseInt(num, 10);
  if (integer % 2 === 0) {
    return integer + 1;
  }
  return integer;
};

const findWeightToReject = async ({
  userName, fieldWeight, authorPermlink,
}) => {
  const epsilon = 0.01; // Convergence tolerance
  let low = 1; // lower bound for weight
  let high = MAX_REJECT_WEIGHT; // upper bound for weight
  let mid;

  /// hive data
  const { userData: account } = await userUtil.getAccount(userName);
  const userWobjectWeight = await getWeightFromObjectExpertise({
    userName, authorPermlink,
  });

  if (!account) return MAX_REJECT_WEIGHT;

  const vests = parseFloat(account.vesting_shares)
    + parseFloat(account.received_vesting_shares)
    - parseFloat(account.delegated_vesting_shares);

  const previousVoteTime = (new Date().getTime() - new Date(`${account.last_vote_time}Z`).getTime()) / 1000;
  const accountVotingPower = Math.min(
    10000,
    account.voting_power + (10000 * previousVoteTime) / 432000,
  );

  /// engine data

  const requests = await Promise.all([
    commentContract.getVotingPower(
      { query: { rewardPoolId: TOKEN_WAIV.POOL_ID, account: userName } },
    ),
    tokensContract.getTokenBalances(
      { query: { symbol: TOKEN_WAIV.SYMBOL, account: userName } },
    ),
  ]);

  const [votingPowers, balances] = requests;

  const stake = balances[0]?.stake ?? '0';
  const delegationsIn = balances[0]?.delegationsIn ?? '0';
  const { votingPower } = engineOperations.calculateMana(votingPowers[0]);

  const finalRshares = parseFloat(stake) + parseFloat(delegationsIn);

  while (high - low > epsilon) {
    mid = (low + high) / 2;

    const power = ((accountVotingPower / 100) * mid) / 5000;
    const rShares = vests * power * 100 - 50000000;
    const rSharesWeight = Math.round(Number(rShares) * 1e-6);
    const fieldWeightHive = (userWobjectWeight + rSharesWeight * 0.25) * (mid / 10000);

    const powerEngine = (votingPower * mid) / 10000;
    const rsharesEngine = (powerEngine * finalRshares) / 10000;
    const fieldWeightWaiv = (userWobjectWeight + rsharesEngine * 0.75) * (mid / 10000);

    const totalWeight = fieldWeightHive + fieldWeightWaiv;

    if (totalWeight > fieldWeight) {
      high = mid;
    } else {
      low = mid;
    }
  }
  // reject is always odd numbers
  return checkEvenAndAddOne(mid);
};

exports.getMinReject = async ({
  userName, author, permlink, authorPermlink,
}) => {
  const { result, error } = await Wobj.findOne(
    { author_permlink: authorPermlink, fields: { $elemMatch: { author, permlink } } },
    { 'fields.$': 1 },
  );
  if (error) return MAX_REJECT_WEIGHT;

  const field = result.fields[0];
  if (!field) return MAX_REJECT_WEIGHT;
  const { weight, active_votes: activeVotes } = field;
  if (activeVotes.length === 1 && activeVotes.find((el) => el.voter === userName)) {
    return 1;
  }
  if (!activeVotes.length && weight === 1) {
    return 1;
  }

  const weightToReject = await findWeightToReject({
    userName, fieldWeight: weight + 1, authorPermlink,
  });

  return { result: weightToReject };
};
