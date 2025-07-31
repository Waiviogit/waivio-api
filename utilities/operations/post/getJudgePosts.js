const _ = require('lodash');
const moment = require('moment');
const {
  mutedUserModel,
  hiddenPostModel,
  Post,
  CampaignV2,
} = require('../../../models');

const getCampaignCondition = async ({ judgeName, authorPermlink }) => {
  const { result } = await CampaignV2.find({
    filter: { contestJudges: judgeName, objects: authorPermlink },
    projection: { durationDays: 1 },
  });
  if (!result?.length) return null;
  const daysAgo = _.maxBy(result, 'durationDays').durationDays;
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

const getJudgePostsByPermlink = async ({
  judgeName, authorPermlink, skip, limit, app,
}) => {
  const { result: mutedUsers } = await mutedUserModel.find({
    condition: { $or: [{ mutedForApps: _.get(app, 'host') }, { mutedBy: judgeName }] },
  });
  const { hiddenPosts = [] } = await hiddenPostModel.getHiddenPosts(judgeName);

  const mutedNames = mutedUsers.map((el) => el.userName);

  const condition = await getCampaignCondition({ judgeName, authorPermlink });
  if (!condition) {
    return {
      posts: [],
      hasMore: false,
    };
  }

  const { result } = await Post.getPostsByCondition({
    condition: {
      ...(mutedNames?.length && { author: { $nin: mutedNames } }),

      ...(hiddenPosts?.length && { _id: { $nin: hiddenPosts } }),
      ...condition,
    },
    skip,
    limit: limit + 1,
  });
  if (!result?.length) return { posts: [], hasMore: false };

  return {
    posts: _.take(result, limit),
    hasMore: result.length > limit,
  };
};

module.exports = {
  getJudgePostsByPermlink,
};
