const engineOperations = require('utilities/hiveEngine/engineOperations');
const hiveOperations = require('utilities/hiveApi/hiveOperations');
const postsUtil = require('utilities/hiveApi/postsUtil');
const { TOKEN_WAIV } = require('constants/hiveEngine');
const jsonHelper = require('utilities/helpers/jsonHelper');
const _ = require('lodash');
const { Post } = require('../../../models');

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
  return _.some(TOKEN_WAIV.TAGS,
    (tag) => _.includes(_.get(jsonMetadata, 'tags', []), tag));
};

const checkPostForRewards = async ({ postDb, author, permlink }) => {
  if (_.has(postDb, 'error')) return false;
  const post = _.get(postDb, 'post');
  if (!post) {
    const { post: comment } = await postsUtil.getPost({ author, permlink });
    if (!comment) return false;
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
