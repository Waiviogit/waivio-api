const {
  Wobj, hiddenPostModel, mutedUserModel, Post,
} = require('models');
const { WOBJECT_LATEST_POSTS_COUNT } = require('constants/wobjectsData');
const { ObjectId } = require('mongoose').Types;
const _ = require('lodash');

const getPosts = async (data) => {
  const { hiddenPosts = [] } = await hiddenPostModel.getHiddenPosts(data.userName);
  const { result: muted = [] } = await mutedUserModel
    .find({ condition: { mutedBy: data.userName } });
  const { condition, error: conditionError } = await getWobjFeedCondition({ ...data, hiddenPosts, muted: _.map(muted, 'userName') });

  if (conditionError) return { error: conditionError };

  const pipeline = makePipeLine({
    matchCondition: { $match: condition },
    limit: data.limit,
    skip: data.skip,
    lastId: data.lastId,
  });

  const { posts, error } = await Post.aggregate(pipeline);
  if (error) return { error };

  return { posts };
};

// Make condition for database aggregation using newsFilter if it exist, else only by "wobject"
const getWobjFeedCondition = async ({
  // eslint-disable-next-line camelcase
  author_permlink, skip, limit, user_languages, lastId, hiddenPosts, muted, newsPermlink, app,
}) => {
  const condition = { blocked_for_apps: { $ne: _.get(app, 'host') } };

  // for moderation posts
  if (lastId) condition._id = { $lt: new ObjectId(lastId) };
  if (!_.isEmpty(hiddenPosts)) {
    condition._id
      ? Object.assign(condition._id, { $nin: hiddenPosts })
      : condition._id = { $nin: hiddenPosts };
  }
  if (!_.isEmpty(muted)) condition.author = { $nin: muted };

  const { wObject, error } = await Wobj.getOne(author_permlink);

  if (error) return { error };

  if (!newsPermlink) {
    if (!skip && limit <= WOBJECT_LATEST_POSTS_COUNT && _.isEmpty(user_languages)) {
      // if wobject have no newsFilter and count of
      // posts less than cashed count => get posts from cashed array
      condition._id = { $in: [...wObject.latest_posts || []] };
      return { condition };
    }
    // eslint-disable-next-line camelcase
    condition['wobjects.author_permlink'] = author_permlink;
    if (!_.isEmpty(user_languages)) condition.language = { $in: user_languages };
    condition.reblog_to = null;
    return { condition };
  }

  const filterField = _.find(wObject.fields, (f) => f.permlink === newsPermlink);
  const newsFilter = JSON.parse(_.get(filterField, 'body', '{}'));

  if (!newsFilter.allowList && !newsFilter.ignoreList) {
    return { error: { message: 'Format not include all required fields' } };
  }
  let firstCond;

  if (Array.isArray(newsFilter.allowList)
      && !_.isEmpty(newsFilter.allowList)
      && _.some(newsFilter.allowList, (rule) => Array.isArray(rule) && rule.length)) {
    const orCondArr = [];

    newsFilter.allowList.forEach((allowRule) => {
      if (Array.isArray(allowRule) && allowRule.length) {
        orCondArr.push({
          'wobjects.author_permlink': { $all: allowRule },
        });
      }
    });
    firstCond = { $or: orCondArr };
  }

  if (!_.isEmpty(_.get(newsFilter, 'typeList'))) {
    const objectTypes = _.isEmpty(_.get(app, 'supported_object_types'))
      ? newsFilter.typeList
      : _.filter(newsFilter.typeList, (el) => _.includes(app.supported_object_types, el));

    const typeCondition = {
      $and: [
        { 'wobjects.author_permlink': { $in: _.get(app, 'supported_objects', ['']) } },
        { 'wobjects.object_type': { $in: objectTypes } },
      ],
    };

    firstCond
      ? firstCond.$or.push(typeCondition)
      : firstCond = typeCondition;
  }

  if (_.some(newsFilter.allowList, (rule) => !rule.length) && _.isEmpty(_.get(newsFilter, 'typeList'))) {
    firstCond = { 'wobjects.author_permlink': author_permlink };
  }

  const secondCond = { 'wobjects.author_permlink': { $nin: _.get(newsFilter, 'ignoreList', []) } };

  condition.$and = [firstCond, secondCond];
  if (!_.isEmpty(user_languages)) condition.$and.push({ language: { $in: user_languages } });
  condition.reblog_to = null;

  return { condition };
};

const makePipeLine = ({
  matchCondition, limit, lastId, skip,
}) => {
  const pipeline = [
    matchCondition,
    { $sort: { _id: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'wobjects',
        localField: 'wobjects.author_permlink',
        foreignField: 'author_permlink',
        as: 'wobjects',
      },
    },
  ];
  if (!lastId) pipeline.splice(-2, 0, { $skip: skip });
  return pipeline;
};

module.exports = async (data) => {
  // data: { author_permlink, limit, skip, user_name }
  const { posts, error: getPostsError } = await getPosts(data);

  if (getPostsError) return { error: getPostsError };
  return { posts };
};
