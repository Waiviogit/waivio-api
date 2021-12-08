const _ = require('lodash');
const { Post } = require('models');
const likePostHelper = require('utilities/helpers/likePostHelper');
const moment = require('moment');
const redisSetter = require('utilities/redis/redisSetter');
const { ERROR_MESSAGE, REDIS_KEYS } = require('constants/common');

module.exports = async (value) => {
  const { hive, waiv, getPost } = await likePostHelper(value);

  const { rShares, postValue } = hive;

  const { rshares, rewards } = waiv;

  const { post, error } = getPost;

  if (!post || error) return { error };

  const updateData = {};

  const voteInPost = _.find(post.active_votes, (v) => v.voter === value.voter);
  voteInPost
    ? Object.assign(
      post.active_votes[post.active_votes.indexOf(voteInPost)],
      { rshares: Math.round(rShares), weight: Math.round(rShares * 1e-6) },
    )
    : post.active_votes.push({
      voter: value.voter,
      percent: value.weight,
      rshares: Math.round(rShares),
      weight: Math.round(rShares * 1e-6),
    });
  updateData.net_rshares = post.net_rshares + rShares;

  updateData.net_rshares_WAIV = post.net_rshares_WAIV ? (post.net_rshares_WAIV + rshares) : rshares;

  updateData.pending_payout_value = postValue < 0 ? '0.000 HBD' : `${postValue.toFixed(3)} HBD`;

  updateData.total_payout_WAIV = updateData.net_rshares_WAIV * rewards;

  updateData.active_votes = post.active_votes;

  const keyValue = `${value.voter}:${value.author}:${value.permlink}`;
  const now = moment().valueOf();
  await redisSetter.zadd({ key: REDIS_KEYS.PROCESSED_LIKES, now, keyValue });

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
  return { post: result };
};
