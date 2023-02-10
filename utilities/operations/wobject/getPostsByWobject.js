/* eslint-disable camelcase */
const {
  Wobj, hiddenPostModel, mutedUserModel, Post,
} = require('models');
const { WOBJECT_LATEST_POSTS_COUNT, OBJECT_TYPES, FIELDS_NAMES } = require('constants/wobjectsData');
const wObjectHelper = require('utilities/helpers/wObjectHelper');
const { ObjectId } = require('mongoose').Types;
const _ = require('lodash');

module.exports = async (data) => {
  const groupIdPermlinks = [];
  const { hiddenPosts = [] } = await hiddenPostModel.getHiddenPosts(data.userName);
  const { result: muted = [] } = await mutedUserModel
    .find({ condition: { mutedBy: data.userName } });

  const { wObject, error: wobjError } = await Wobj.getOne(data.author_permlink);
  if (wobjError) return { error: wobjError };

  const processedObj = await wObjectHelper.processWobjects({
    wobjects: [_.cloneDeep(wObject)],
    locale: data.locale,
    fields: [FIELDS_NAMES.NEWS_FEED, FIELDS_NAMES.GROUP_ID],
    returnArray: false,
    app: data.app,
  });

  if (data.newsFeed) {
    const newsPermlink = _.get(processedObj, 'newsFeed.permlink');
    if (!newsPermlink) return { posts: [] };
    data.newsPermlink = newsPermlink;
  }

  if (processedObj.groupId) {
    const groupIdObjects = await Wobj.getWobjectsByGroupId(processedObj.groupId);
    const processedObjects = await wObjectHelper.processWobjects({
      wobjects: groupIdObjects,
      locale: data.locale,
      fields: [FIELDS_NAMES.GROUP_ID],
      returnArray: true,
      app: data.app,
    });
    const links = _.chain(processedObjects)
      .filter((o) => _.some(processedObj.groupId, (id) => _.includes(_.get(o, 'groupId', []), id)))
      .map('author_permlink').value();
    groupIdPermlinks.push(...links);
  }

  const { condition, error: conditionError } = await getWobjFeedCondition({
    ...data, hiddenPosts, muted: _.map(muted, 'userName'), wObject, groupIdPermlinks,
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
  lastId, hiddenPosts, muted, newsPermlink, app, wObject, groupIdPermlinks,
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
    return getNewsFilterCondition({
      condition, wObject, newsPermlink, app, author_permlink,
    });
  }

  // we will never use this condition
  if (!skip && limit <= WOBJECT_LATEST_POSTS_COUNT && _.isEmpty(user_languages)) {
    // if wobject have no newsFilter and count of
    // posts less than cashed count => get posts from cashed array
    condition._id = { $in: [...wObject.latest_posts || []] };
    return { condition };
  }
  condition['wobjects.author_permlink'] = { $in: _.compact([author_permlink, ...groupIdPermlinks]) };
  return { condition };
};

const getNewsFilterCondition = ({
  condition, wObject, newsPermlink, app, author_permlink,
}) => {
  const newsFilter = JSON.parse(_.get(
    _.find(wObject.fields, (f) => f.permlink === newsPermlink),
    'body',
    '{}',
  ));
  let firstCond;
  const secondCond = { 'wobjects.author_permlink': { $nin: _.get(newsFilter, 'ignoreList', []) } };

  if (
    !newsFilter.allowList
    && !newsFilter.ignoreList
    && !newsFilter.typeList
    && !newsFilter.authors
  ) {
    return { error: { message: 'Format not include all required fields' } };
  }

  if (!_.isEmpty(newsFilter.allowList)
    && _.some(newsFilter.allowList, (rule) => !_.isEmpty(rule))) {
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

    const typeCondition = { $and: [{ 'wobjects.object_type': { $in: objectTypes } }] };
    if (app.inherited) typeCondition.$and.push({ 'wobjects.author_permlink': { $in: _.get(app, 'supported_objects') } });

    firstCond
      ? firstCond.$or.push(typeCondition)
      : firstCond = typeCondition;
  }

  if (
    _.some(newsFilter.allowList, (rule) => _.isEmpty(rule))
    && _.isEmpty(_.get(newsFilter, 'typeList'))
    && _.isEmpty(_.get(newsFilter, 'authors'))
  ) {
    firstCond = { 'wobjects.author_permlink': author_permlink };
  }
  if (!_.isEmpty(newsFilter.authors)) {
    // posts only includes and objects
    condition.author = { $in: newsFilter.authors };
  }

  condition.$and = _.compact([firstCond, secondCond]);

  return { condition };
};
