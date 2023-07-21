const engineOperations = require('utilities/hiveEngine/engineOperations');
const hiveOperations = require('utilities/hiveApi/hiveOperations');
const postsUtil = require('utilities/hiveApi/postsUtil');
const { TOKEN_WAIV } = require('constants/hiveEngine');
const jsonHelper = require('utilities/helpers/jsonHelper');
const _ = require('lodash');
const {
  Post, Comment, Wobj, UserWobjects,
} = require('models');
const { redisGetter } = require('utilities/redis');
const { WHITE_LIST_KEY, VOTE_COST } = require('constants/wobjectsData');
const { roundToEven } = require('utilities/helpers/calcHelper');
const userUtil = require('../../hiveApi/userUtil');

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
    minWeight: roundToEven(minWeight),
  };
};

const getWeightFromObjectExpertise = async ({
  userName, authorPermlink,
}) => {
  const { result, error } = await UserWobjects.findOne({
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
  const { userData: account } = await userUtil.getAccount(userName);
  const userWobjectWeight = await getWeightFromObjectExpertise({
    userName, authorPermlink,
  });
  if (!account) return MAX_REJECT_WEIGHT;
  const epsilon = 0.01; // Convergence tolerance
  let low = 1; // lower bound for weight
  let high = MAX_REJECT_WEIGHT; // upper bound for weight
  let mid;

  const vests = parseFloat(account.vesting_shares)
    + parseFloat(account.received_vesting_shares)
    - parseFloat(account.delegated_vesting_shares);

  const previousVoteTime = (new Date().getTime() - new Date(`${account.last_vote_time}Z`).getTime()) / 1000;
  const accountVotingPower = Math.min(
    10000,
    account.voting_power + (10000 * previousVoteTime) / 432000,
  );

  while (high - low > epsilon) {
    mid = (low + high) / 2;

    const power = ((accountVotingPower / 100) * mid) / 5000;
    const rShares = vests * power * 100 - 50000000;

    const rSharesWeight2 = Math.round(Number(rShares) * 1e-6);
    const currentMaxWeight2 = (userWobjectWeight + rSharesWeight2 * 0.25) * (mid / 10000);

    if (currentMaxWeight2 > fieldWeight) {
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
