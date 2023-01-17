/* eslint-disable camelcase */
const {
  Wobj, hiddenPostModel, mutedUserModel, Post,
} = require('models');
const { WOBJECT_LATEST_POSTS_COUNT } = require('constants/wobjectsData');
const queryHelper = require('utilities/helpers/queryHelper');
const { ObjectId } = require('mongoose').Types;
const _ = require('lodash');

module.exports = async (data) => {
  const { hiddenPosts = [] } = await hiddenPostModel.getHiddenPosts(data.userName);
  const { result: muted = [] } = await mutedUserModel
    .find({ condition: { mutedBy: data.userName } });

  const { wObject, error: wobjError } = await Wobj.getOne(data.author_permlink);
  if (wobjError) return { error: wobjError };

  const { condition, error: conditionError } = await getWobjFeedCondition({
    ...data, hiddenPosts, muted: _.map(muted, 'userName'), wObject,
  });
  if (conditionError) return { error: conditionError };

  const { posts, error } = await Post.getWobjectPosts({
    condition,
    limit: data.limit,
    lastId: data.lastId,
    skip: data.skip,
  });
  if (error) return { error };

  return { posts };
};

// Make condition for database aggregation using newsFilter if it exist, else only by "wobject"
const getWobjFeedCondition = async ({
  author_permlink, skip, limit, user_languages,
  lastId, hiddenPosts, muted, newsPermlink, app, wObject,
}) => {
  const condition = {
    blocked_for_apps: { $ne: _.get(app, 'host') },
    reblog_to: null,
  };
  // for moderation posts
  if (lastId) condition._id = { $lt: new ObjectId(lastId) };
  if (!_.isEmpty(hiddenPosts)) {
    condition._id
      ? Object.assign(condition._id, { $nin: hiddenPosts })
      : condition._id = { $nin: hiddenPosts };
  }
  if (!_.isEmpty(muted)) condition.author = { $nin: muted };
  if (!_.isEmpty(user_languages)) condition.language = { $in: user_languages };

  if (newsPermlink) {
    return queryHelper.getNewsFilterCondition({
      condition, wObject, newsPermlink, app,
    });
  }

  // we will never use this condition
  if (!skip && limit <= WOBJECT_LATEST_POSTS_COUNT && _.isEmpty(user_languages)) {
    // if wobject have no newsFilter and count of
    // posts less than cashed count => get posts from cashed array
    condition._id = { $in: [...wObject.latest_posts || []] };
    return { condition };
  }

  condition['wobjects.author_permlink'] = author_permlink;
  return { condition };
};
