const { CampaignV2, CampaignPayments, mutedUserModel } = require('../../models');
const _ = require('lodash');
const redisGetter = require('../redis/redisGetter');
const moment = require('moment');
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
  const userName = _.get(user, 'name');
  const assignedObjects = await findAssignedMainObjects(userName);
  const { rewardBalanceTimesRate, claims } = await getExpertiseVariables();
  const mutedNames = await mutedUserModel.findMutedBy({ userName });

  const { result = [] } = await CampaignV2.aggregate([
    {
      $match: {
        status: CAMPAIGN_STATUSES.ACTIVE,
        ...(mutedNames.length && { guideName: { $nin: mutedNames } }),
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
      },
    },
    {
      $addFields: {
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
        reservationPermlink: {
          $let: {
            vars: {
              firstMember: {
                $arrayElemAt: ['$assignedUser', 0],
              },
            },
            in: '$$firstMember.reservationPermlink',
          },
        },
        commentsCount: {
          $let: {
            vars: {
              firstMember: {
                $arrayElemAt: ['$assignedUser', 0],
              },
            },
            in: '$$firstMember.commentsCount',
          },
        },
        payoutTokenRateUSD: {
          $let: {
            vars: {
              firstMember: {
                $arrayElemAt: ['$assignedUser', 0],
              },
            },
            in: '$$firstMember.payoutTokenRateUSD',
          },
        },
        rootName: {
          $let: {
            vars: {
              firstMember: {
                $arrayElemAt: ['$assignedUser', 0],
              },
            },
            in: '$$firstMember.rootName',
          },
        },
        // reserved: { $gt: ['$assignedUser', []] },
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
            { $gte: ['$daysPassed', '$frequencyAssign'] },
            { $eq: ['$daysPassed', null] },
          ],
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

  _.forEach(result, (r) => {
    r.stringId = r._id.toString();
    r.notEligible = !r.canAssignByBudget
      || !r.canAssignByCurrentDay
      || !r.notAssigned
      || !r.frequency;
  });

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
  const payoutTokens = _.uniq(_.map(campaigns, 'payoutToken'));
  const guideNames = _.uniq(_.map(campaigns, 'guideName'));
  for (const payoutToken of payoutTokens) {
    const guidesPayables = await getGuidesPayables({ guideNames, payoutToken });

    const matchedCampaigns = _.filter(campaigns, (c) => c.payoutToken === payoutToken);
    for (const matchedCampaign of matchedCampaigns) {
      const payedRecord = _.find(guidesPayables, (gp) => gp.guideName === matchedCampaign.guideName);
      campaignsWithPayed.push({
        ...matchedCampaign,
        totalPayed: _.get(payedRecord, 'payed', 0),
      });
    }
  }
  return campaignsWithPayed;
};

const addPrimaryCampaign = ({ object, primaryCampaigns = [] }) => {
  const minReward = (_.minBy(primaryCampaigns, 'rewardInUSD')).rewardInUSD;
  const maxReward = (_.maxBy(primaryCampaigns, 'rewardInUSD')).rewardInUSD;

  const notEligibleCampaigns = _.filter(primaryCampaigns, (c) => c.notEligible);
  const notEligible = notEligibleCampaigns.length === primaryCampaigns.length;

  object.campaigns = {
    min_reward: minReward,
    max_reward: maxReward,
    newCampaigns: true,
    notEligible,
  };
};

const addSecondaryCampaigns = ({ object, secondaryCampaigns }) => {
  const proposition = _.maxBy(
    _.map(secondaryCampaigns, (c) => ({ ...c, newCampaigns: true })),
    'rewardInUSD',
  );
  proposition.reserved = false;
  if (!_.isEmpty(proposition.assignedUser)) {
    proposition.reserved = _.get(proposition, 'assignedUser[0].objectPermlink') === object.author_permlink;
  }

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
    const primaryCampaigns = _.filter(campaignsWithPayed, { requiredObject: object.author_permlink });
    if (!_.isEmpty(primaryCampaigns) && !onlySecondary) {
      addPrimaryCampaign({ object, primaryCampaigns });
    }

    const secondaryCampaigns = _.filter(
      campaignsWithPayed,
      (campaign) => _.includes(campaign.objects, object.author_permlink),
    );
    if (!_.isEmpty(secondaryCampaigns)) addSecondaryCampaigns({ object, secondaryCampaigns });
  }
};

module.exports = {
  addNewCampaignsToObjects,
};
