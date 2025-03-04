/* eslint-disable camelcase */
const _ = require('lodash');
const { Post } = require('../../../models');
const likePostHelper = require('../../helpers/likePostHelper');
const moment = require('moment');
const redisSetter = require('../../redis/redisSetter');
const { ERROR_MESSAGE, REDIS_KEYS } = require('../../../constants/common');
const { getPostObjects } = require('../../helpers/postHelper');
const jsonHelper = require('../../helpers/jsonHelper');
const { TOKEN_WAIV } = require('../../../constants/hiveEngine');

module.exports = async (value) => {
  const { hive, waiv, getPost } = await likePostHelper(value);

  const { post, error } = getPost;
  if (!post) return { error: new Error(ERROR_MESSAGE.NOT_FOUND) };
  if (error) return { error };

  const updateData = formUpdateData({
    weight: value.weight,
    voter: value.voter,
    post,
    hive,
    waiv,
  });

  const { result, error: updateError } = await Post.findOneAndUpdate(
    {
      $or: [
        { root_author: value.author, permlink: value.permlink },
        { author: value.author, permlink: value.permlink },
      ],
    },
    { $set: updateData },
    { new: true },
  );

  if (!result || updateError) return { error: updateError || new Error(ERROR_MESSAGE.NOT_FOUND) };

  const keyValue = `${value.voter}:${value.author}:${value.permlink}`;
  const now = moment().valueOf();
  await redisSetter.zadd({ key: REDIS_KEYS.PROCESSED_LIKES_HIVE, now, keyValue });
  await redisSetter.zadd({ key: REDIS_KEYS.PROCESSED_LIKES_ENGINE, now, keyValue });
  const wobjects = await getPostObjects(_.get(result, 'wobjects', []));

  result.wobjects = _.get(wobjects, 'wobjectPercents', []);
  result.fullObjects = _.get(wobjects, 'wObjectsData', []);

  return { post: result };
};

const checkPostEligibilityWaiv = (post) => {
  const json = jsonHelper.parseJson(post?.json_metadata);
  const tags = json?.tags ?? [];

  return tags.some((t) => TOKEN_WAIV.TAGS.includes(t));
};

const formUpdateData = ({
  post, hive, waiv, weight, voter,
}) => {
  const voteInPost = _.find(post.active_votes, (v) => v.voter === voter);
  const createdOverAWeek = moment().diff(moment(_.get(post, 'createdAt')), 'day') > 7;
  if (createdOverAWeek) {
    return processOverWeekLike({
      voteInPost, post, weight, voter,
    });
  }
  const eligible = checkPostEligibilityWaiv(post);
  if (!eligible) {
    waiv.rshares = 0;
  }

  let { net_rshares } = post;
  let net_rshares_WAIV = post.net_rshares_WAIV || 0;

  if (weight === 0) {
    if (voteInPost) {
      net_rshares -= _.get(voteInPost, 'rshares', 0);
      net_rshares_WAIV -= _.get(voteInPost, 'rsharesWAIV', 0);
    }
  } else {
    net_rshares += hive.rShares;
    net_rshares_WAIV += waiv.rshares;
  }

  const total_payout_WAIV = net_rshares_WAIV * waiv.rewards;
  const pending_payout_value = net_rshares * hive.rewards * hive.price;

  return {
    net_rshares,
    net_rshares_WAIV,
    pending_payout_value: pending_payout_value < 0 ? '0.000 HBD' : `${pending_payout_value.toFixed(3)} HBD`,
    total_payout_WAIV: total_payout_WAIV < 0 ? 0 : total_payout_WAIV,
    active_votes: getActiveVotes({
      post, voteInPost, weight, voter, waiv, hive,
    }),
  };
};

const processOverWeekLike = ({
  post, voteInPost, weight, voter,
}) => ({
  active_votes: getActiveVotes({
    post, voteInPost, weight, voter, waiv: { rshares: 0 }, hive: { rShares: 0 },
  }),
});

const getActiveVotes = ({
  weight, post, voter, waiv, hive, voteInPost,
}) => {
  if (weight === 0 && voteInPost) {
    Object.assign(
      post.active_votes[post.active_votes.indexOf(voteInPost)],
      {
        rshares: 0, weight: 0, rsharesWAIV: 0, percent: 0,
      },
    );
  } else {
    voteInPost
      ? Object.assign(
        post.active_votes[post.active_votes.indexOf(voteInPost)],
        {
          percent: weight,
          rshares: Math.round(hive.rShares) || 1,
          weight: Number((hive.hiveVotePrice + waiv.engineVotePrice).toFixed(8)) || 0,
          rsharesWAIV: waiv.rshares,
        },
      )
      : post.active_votes.push({
        voter,
        percent: weight,
        rshares: Math.round(hive.rShares) || 1,
        weight: Number((hive.hiveVotePrice + waiv.engineVotePrice).toFixed(8)) || 0,
        rsharesWAIV: waiv.rshares || 1,
      });
  }
  return post.active_votes;
};
