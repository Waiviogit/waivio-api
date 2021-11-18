const engineQuery = require('utilities/hiveEngine/engineQuery');

/**
 * fields
 * _id: numeric ID of reward pool.
 * symbol: symbol of reward pool.
 * rewardPool: amount currently in the reward pool.
 * lastRewardTimestamp: timestamp of when reward pool was last increased.
 * lastPostRewardTimestamp: timestamp of when post rewards were last computed.
 * createdTimestamp: timestamp of when the reward pool was created.
 * config: config of reward pool, see createRewardPool.
 * pendingClaims: accumulated post claims, roughly over (2 times the cashoutWindowDays) days.
 * Decays and grows to match reward pool usage.
 * A post's payout is determined by applying the reward curve to the rshares of a post,
 * dividing by pendingClaims,and multiplying by the reward pool.
 * active: whether the reward pool is active.
 */

exports.getRewardPools = async ({ query }) => engineQuery({
  params: {
    contract: 'comments',
    table: 'rewardPools',
    query,
  },
});

/**
 * contains information about an account's voting power
 * fields
 * rewardPoolId: reward pool ID
 * account: account name
 * lastVoteTimestamp: timestamp of last vote or downvote
 * votingPower: voting power at last vote timestamp
 * downvotingPower: downvoting power at last vote timestamp
 */

exports.getVotingPower = async ({ query }) => engineQuery({
  params: {
    contract: 'comments',
    table: 'votingPower',
    query,
  },
});
