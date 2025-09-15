const _ = require('lodash');
const moment = require('moment');
const {
  mutedUserModel,
  hiddenPostModel,
  Post,
  CampaignV2,
} = require('../../../models');
const { CAMPAIGN_STATUSES } = require('../../../constants/campaignsData');

const getCampaignCondition = async ({ judgeName, authorPermlink, activationPermlink }) => {
  const { result } = await CampaignV2.findOne({
    filter: {
      contestJudges: judgeName,
      status: CAMPAIGN_STATUSES.ACTIVE,
      activationPermlink,
    },
    projection: { durationDays: 1 },
  });
  if (!result) return null;
  const daysAgo = result.durationDays;
  const startDate = moment().subtract(daysAgo, 'days').toDate();

  const condition = {
    createdAt: { $gte: startDate },
  };
  if (authorPermlink.startsWith('@')) {
    condition.mentions = authorPermlink.replace('@', '');
  } else {
    condition['wobjects.author_permlink'] = authorPermlink;
  }

  return condition;
};

const getJudgesCondition = async ({
  judgeName, authorPermlink, app, activationPermlink,
}) => {
  const condition = await getCampaignCondition({ judgeName, authorPermlink, activationPermlink });
  if (!condition) return null;
  const { result: mutedUsers } = await mutedUserModel.find({
    condition: { $or: [{ mutedForApps: _.get(app, 'host') }, { mutedBy: judgeName }] },
  });
  const { hiddenPosts = [] } = await hiddenPostModel.getHiddenPosts(judgeName);

  const mutedNames = mutedUsers.map((el) => el.userName);

  return {
    ...(mutedNames?.length && { author: { $nin: mutedNames } }),
    ...(hiddenPosts?.length && { _id: { $nin: hiddenPosts } }),
    ...condition,
  };
};

const getJudgePostsByPermlink = async ({
  judgeName, authorPermlink, skip, limit, app, activationPermlink,
}) => {
  const postsCondition = await getJudgesCondition({
    judgeName, authorPermlink, app, activationPermlink,
  });
  if (!postsCondition) {
    return {
      posts: [],
      hasMore: false,
    };
  }

  const { result } = await Post.getPostsByCondition({
    condition: postsCondition,
    skip,
    limit: limit + 1,
  });
  if (!result?.length) return { posts: [], hasMore: false };

  return {
    posts: _.take(result, limit),
    hasMore: result.length > limit,
  };
};

const getJudgePostsLinksByPermlink = async ({
  judgeName, authorPermlink, skip, limit, app, activationPermlink,
}) => {
  const postsCondition = await getJudgesCondition({
    judgeName, authorPermlink, app, activationPermlink,
  });
  if (!postsCondition) {
    return {
      posts: [],
      hasMore: false,
    };
  }

  const { result } = await Post.find({
    filter: postsCondition,
    projection: { author: 1, permlink: 1 },
    options: {
      skip,
      limit: limit + 1,
    },
  });
  if (!result?.length) return { posts: [], hasMore: false };

  return {
    posts: _.take(result, limit),
    hasMore: result.length > limit,
  };
};

module.exports = {
  getJudgePostsByPermlink,
  getJudgePostsLinksByPermlink,
};
