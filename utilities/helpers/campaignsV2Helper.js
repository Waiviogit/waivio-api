const { CampaignV2, CampaignPayments } = require('models');
const _ = require('lodash');
const redisGetter = require('utilities/redis/redisGetter');
const { CAMPAIGN_STATUSES, RESERVATION_STATUSES } = require('../../constants/campaignsData');
const { CACHE_KEY } = require('../../constants/common');
const { CP_TRANSFER_TYPES } = require('../../constants/campaignsV2');

const getExpertiseVariables = async () => {
  const { result: rewardFund } = await redisGetter.getHashAll({
    key: CACHE_KEY.REWARD_FUND,
  });
  const { result: median } = await redisGetter.getHashAll({
    key: CACHE_KEY.CURRENT_MEDIAN_HISTORY_PRICE,
  });
  const recentClaims = parseFloat(_.get(rewardFund, 'recent_claims', '0'));
  const rewardBalance = parseFloat(_.get(rewardFund, 'reward_balance', '0'));

  const rate = parseFloat(_.get(median, 'base', '0'))
    / parseFloat(_.get(median, 'quote', '0'));

  return {
    rewardBalanceTimesRate: rewardBalance * rate,
    claims: recentClaims / 1000000,
  };
};

const getAggregatedCampaigns = async ({ user, permlinks }) => {
  const { rewardBalanceTimesRate, claims } = await getExpertiseVariables();
  const userName = _.get(user, 'name');

  const { result = [] } = await CampaignV2.aggregate([
    {
      $match: {
        status: CAMPAIGN_STATUSES.ACTIVE,
        $or: [
          { objects: { $in: permlinks } },
          { requiredObject: { $in: permlinks } },
        ],
      },
    },
    {
      $addFields: {
        requiredExpertise: {
          $divide: [
            {
              $multiply: ['$userRequirements.minExpertise', claims],
            },
            rewardBalanceTimesRate,
          ],
        },
        blacklist: {
          $setDifference: ['$blacklistUsers', '$whitelistUsers'],
        },
        assignedUser: {
          $filter: {
            input: '$users',
            as: 'user',
            cond: {
              $and: [
                { $eq: ['$$user.status', RESERVATION_STATUSES.ASSIGNED] },
                { $eq: ['$$user.name', userName] },
              ],
            },
          },
        },
      },
    },
    {
      $addFields: {
        reserved: { $gt: ['$assignedUser', []] },
        reservationCreatedAt: {
          $let: {
            vars: {
              firstMember: {
                $arrayElemAt: ['$assignedUser', 0],
              },
            },
            in: '$$firstMember.createdAt',
          },
        },
        posts: { $gte: [_.get(user, 'count_posts', 0), '$userRequirements.minPosts'] },
        followers: {
          $gte: [_.get(user, 'followers_count', 0), '$userRequirements.minFollowers'],
        },
        expertise: {
          $gte: [_.get(user, 'wobjects_weight', 0), '$requiredExpertise'],
        },
      },
    },
    {
      $match: {
        posts: true,
        followers: true,
        expertise: true,
        blacklist: { $ne: userName },
      },
    },
  ]);

  return result;
};

const getGuidesPayables = async ({ guideNames, payoutToken }) => {
  const { result = [] } = await CampaignPayments.aggregate(
    [
      {
        $match: { guideName: { $in: guideNames }, payoutToken },
      },
      {
        $group: {
          _id: '$guideName',
          transfers: {
            $push: {
              $cond: [
                { $in: ['$type', CP_TRANSFER_TYPES] },
                '$$ROOT',
                '$$REMOVE',
              ],
            },
          },
        },
      },
      {
        $addFields: {
          payed: { $sum: '$transfers.amount' },
        },
      },
      {
        $project: {
          payed: { $convert: { input: '$payed', to: 'double' } },
          guideName: '$_id',
        },
      },
    ],
  );

  return result;
};

const addTotalPayedToCampaigns = async (campaigns) => {
  const campaignsWithPayed = [];
  const payoutTokens = _.map(campaigns, 'payoutToken');
  const guideNames = _.map(campaigns, 'guideName');
  for (const payoutToken of payoutTokens) {
    const guidesPayables = await getGuidesPayables({ guideNames, payoutToken });
    if (_.isEmpty(guidesPayables)) continue;
    const matchedCampaigns = _.filter(campaigns, (c) => c.payoutToken === payoutToken);
    for (const matchedCampaign of matchedCampaigns) {
      const payedRecord = _.find(
        guidesPayables, (gp) => gp.guideName === matchedCampaign.guideName,
      );
      campaignsWithPayed.push({
        ...matchedCampaign,
        totalPayed: payedRecord.payed,
      });
    }
  }
  return campaignsWithPayed;
};

const addPrimaryCampaign = ({ object, primaryCampaigns }) => {
  const minReward = (_.minBy(primaryCampaigns, 'rewardInUSD')).rewardInUSD;
  const maxReward = (_.maxBy(primaryCampaigns, 'rewardInUSD')).rewardInUSD;

  object.campaigns = {
    min_reward: _.min([minReward, _.get(object, 'campaigns.min_reward', 0)]),
    max_reward: _.max([maxReward, _.get(object, 'campaigns.max_reward', 0)]),
    newCampaigns: true,
  };
};

const addSecondaryCampaigns = ({ object, secondaryCampaigns }) => {
  const proposition = _.maxBy(
    _.map(secondaryCampaigns, (c) => ({ ...c, newCampaigns: true })),
    'rewardInUSD',
  );

  if (object.propositions) {
    object.propositions.push(proposition);
    return;
  }
  object.propositions = [proposition];
};

const addNewCampaignsToObjects = async ({
  user, wobjects, onlySecondary = false,
}) => {
  const campaigns = await getAggregatedCampaigns({ user, permlinks: _.map(wobjects, 'author_permlink') });
  const campaignsWithPayed = await addTotalPayedToCampaigns(campaigns);
  if (_.isEmpty(campaignsWithPayed)) return;
  for (const object of wobjects) {
    const primaryCampaigns = _.filter(
      campaignsWithPayed, { requiredObject: object.author_permlink },
    );
    if (!_.isEmpty(primaryCampaigns) && !onlySecondary) {
      addPrimaryCampaign({ object, primaryCampaigns });
    }

    const secondaryCampaigns = _.filter(campaignsWithPayed,
      (campaign) => _.includes(campaign.objects, object.author_permlink));
    if (!_.isEmpty(secondaryCampaigns)) addSecondaryCampaigns({ object, secondaryCampaigns });
  }
};

module.exports = {
  addNewCampaignsToObjects,
};
