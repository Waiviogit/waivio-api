const { CampaignV2 } = require('models');
const _ = require('lodash');
const moment = require('moment');
const redisGetter = require('utilities/redis/redisGetter');
const { CAMPAIGN_STATUSES, RESERVATION_STATUSES } = require('../../constants/campaignsData');
const { CACHE_KEY } = require('../../constants/common');

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

const findAssignedMainObjects = async (userName) => {
  if (!userName) return [];
  const { result } = await CampaignV2.find({
    filter: {
      users: {
        $elemMatch: { name: userName, status: RESERVATION_STATUSES.ASSIGNED },
      },
    },
    projection: { requiredObject: 1 },
  });
  return _.uniq(_.map(result, 'requiredObject'));
};

const getAggregatedCampaigns = async ({ user, permlinks }) => {
  const currentDay = moment().format('dddd').toLowerCase();
  const assignedObjects = await findAssignedMainObjects(_.get(user, 'name'));
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
        completedUser: {
          $filter: {
            input: '$users',
            as: 'user',
            cond: {
              $and: [
                { $eq: ['$$user.name', userName] },
                { $eq: ['$$user.status', 'completed'] },
              ],
            },
          },
        },
        thisMonthCompleted: {
          $filter: {
            input: '$users',
            as: 'user',
            cond: {
              $and: [
                { $eq: ['$$user.status', 'completed'] },
                {
                  $gte: [
                    '$$user.updatedAt',
                    moment.utc().startOf('month').toDate(),
                  ],
                },
              ],
            },
          },
        },
        assigned: {
          $filter: {
            input: '$users',
            as: 'user',
            cond: { $eq: ['$$user.status', 'assigned'] },
          },
        },
      },
    },
    {
      $addFields: {
        thisMonthCompleted: { $size: '$thisMonthCompleted' },
        assigned: { $size: '$assigned' },
        completedUser: {
          $arrayElemAt: [
            '$completedUser',
            {
              $indexOfArray: [
                '$completedUser.updatedAt',
                { $max: '$array.updatedAt' },
              ],
            },
          ],
        },
      },
    },
    {
      $addFields: {
        monthBudget: {
          $multiply: [
            '$reward',
            { $sum: ['$thisMonthCompleted', '$assigned'] },
          ],
        },
        daysPassed: {
          $dateDiff: {
            startDate: '$completedUser.updatedAt',
            endDate: moment.utc().toDate(),
            unit: 'day',
          },
        },
        assignedUser: {
          $filter: {
            input: '$users',
            as: 'user',
            cond: {
              $and: [
                { $eq: ['$$user.status', RESERVATION_STATUSES.ASSIGNED] },
                { $eq: ['$$user.name', userName] },
                {
                  $eq: ['$$user.objectPermlink', '$objects'],
                },
              ],
            },
          },
        },
      },
    },
    {
      $addFields: {
        reserved: { $gt: ['$assignedUser', []] },
        canAssignByBudget: { $gt: ['$budget', '$monthBudget'] },
        canAssignByCurrentDay: {
          $eq: [`$reservationTimetable.${currentDay}`, true],
        },
        posts: { $gte: [_.get(user, 'count_posts', 0), '$userRequirements.minPosts'] },
        followers: {
          $gte: [_.get(user, 'followers_count', 0), '$userRequirements.minFollowers'],
        },
        expertise: {
          $gte: [_.get(user, 'wobjects_weight', 0), '$requiredExpertise'],
        },
        notAssigned: {
          $cond: [{ $in: ['$requiredObject', assignedObjects] }, false, true],
        },
        frequency: {
          $or: [
            { $gt: ['$daysPassed', '$frequencyAssign'] },
            { $eq: ['$daysPassed', null] },
          ],
        },
      },
    },
    {
      $match: {
        canAssignByBudget: true,
        canAssignByCurrentDay: true,
        posts: true,
        followers: true,
        expertise: true,
        notAssigned: true,
        frequency: true,
        blacklist: { $ne: userName },
      },
    },
  ]);
  return result;
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
  const propositions = _.map(secondaryCampaigns, (c) => ({ ...c, newCampaigns: true }));
  if (object.propositions) {
    object.propositions.push(...propositions);
    return;
  }
  object.propositions = propositions;
};

exports.addNewCampaignsToObjects = async ({
  user, wobjects,
}) => {
  const campaigns = await getAggregatedCampaigns({ user, permlinks: _.map(wobjects, 'author_permlink') });
  if (_.isEmpty(campaigns)) return;
  for (const object of wobjects) {
    const primaryCampaigns = _.filter(campaigns, { requiredObject: object.author_permlink });
    if (!_.isEmpty(primaryCampaigns)) addPrimaryCampaign({ object, primaryCampaigns });
    const secondaryCampaigns = _.filter(campaigns,
      (campaign) => _.includes(campaign.objects, object.author_permlink));
    if (!_.isEmpty(secondaryCampaigns)) addSecondaryCampaigns({ object, secondaryCampaigns });
  }
};
