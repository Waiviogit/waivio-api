const { CampaignV2 } = require('database').models;

const find = async ({ filter, projection = {}, options = {} }) => {
  try {
    return { result: await CampaignV2.find(filter, projection, options).lean() };
  } catch (error) {
    return { error };
  }
};

const aggregate = async (pipeline) => {
  try {
    return { result: await CampaignV2.aggregate(pipeline) };
  } catch (error) {
    return { error };
  }
};

const findOne = async ({ filter, projection = {}, options = {} }) => {
  try {
    return { result: await CampaignV2.findOne(filter, projection, options).lean() };
  } catch (error) {
    return { error };
  }
};

const findCompletedByPost = async (post) => {
  const { result } = await find({
    filter: {
      users: {
        $elemMatch: {
          name: post.author,
          reviewPermlink: post.permlink,
          status: 'completed',
        },
      },
    },
    projection: {
      rewardInUSD: 1,
      'users.$': 1,
      payoutToken: 1,
      type: 1,
      guideName: 1,
      payoutTokenRateUSD: 1,
      name: 1,
    },
  });

  return result;
};

module.exports = {
  findOne,
  aggregate,
  find,
  findCompletedByPost,
};
