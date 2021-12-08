/* eslint-disable camelcase */
const _ = require('lodash');
const { Post } = require('models');
const likePostHelper = require('utilities/helpers/likePostHelper');
const moment = require('moment');
const redisSetter = require('utilities/redis/redisSetter');
const { ERROR_MESSAGE, REDIS_KEYS } = require('constants/common');

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
  await redisSetter.zadd({ key: REDIS_KEYS.PROCESSED_LIKES, now, keyValue });

  return { post: result };
};

const formUpdateData = ({
  post, hive, waiv, weight, voter,
}) => {
  const voteInPost = _.find(post.active_votes, (v) => v.voter === voter);

  let { net_rshares } = post;
  let net_rshares_WAIV = post.net_rshares_WAIV || 0;

  if (weight === 0) {
    if (voteInPost) {
      net_rshares -= voteInPost.rshares;
      net_rshares_WAIV -= voteInPost.net_rshares_WAIV;
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
          rshares: Math.round(hive.rShares),
          weight: Math.round(hive.rShares * 1e-6),
          rsharesWAIV: waiv.rshares,
        },
      )
      : post.active_votes.push({
        voter,
        percent: weight,
        rshares: Math.round(hive.rShares) || 1,
        weight: Math.round(hive.rShares * 1e-6),
        rsharesWAIV: waiv.rshares || 1,
      });
  }
  return post.active_votes;
};
