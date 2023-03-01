/* eslint-disable camelcase */
const {
  Wobj, hiddenPostModel, mutedUserModel, Post,
} = require('models');
const { FIELDS_NAMES } = require('constants/wobjectsData');
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

  const pinnedLinks = _
    .chain(wObject.fields)
    .filter((f) => f.name === FIELDS_NAMES.PIN)
    .map((el) => el.body)
    .value();

  const removeLinks = _
    .chain(wObject.fields)
    .filter((f) => f.name === FIELDS_NAMES.REMOVE)
    .map((el) => el.body)
    .value();

  const processedObj = await wObjectHelper.processWobjects({
    wobjects: [_.cloneDeep(wObject)],
    locale: data.locale,
    fields: [FIELDS_NAMES.NEWS_FEED, FIELDS_NAMES.GROUP_ID, FIELDS_NAMES.PIN, FIELDS_NAMES.REMOVE],
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

  const removeFilter = getRemoveFilter(processedObj);

  const { condition, error: conditionError } = await getWobjFeedCondition({
    ...data, hiddenPosts, muted: _.map(muted, 'userName'), wObject, groupIdPermlinks, removeFilter,
  });

  if (conditionError) return { error: conditionError };

  const { posts, error } = await Post.getWobjectPosts({
    condition,
    limit: data.limit,
    lastId: data.lastId,
    skip: data.skip,
  });
  if (error) return { error };

  if (data.skip === 0) {
    const { posts: pinPosts } = await Post.getManyPosts(getPinFilter(processedObj));
    if (!_.isEmpty(pinPosts)) {
      posts.unshift(..._.map(pinPosts, (el) => ({ ...el, pin: true })));
    }
  }

  if (!_.isEmpty(pinnedLinks) || !_.isEmpty(removeLinks)) {
    _.forEach(posts, (p) => {
      if (_.includes(pinnedLinks, `${p.author}/${p.permlink}`)) {
        p.hasPinUpdate = true;
      }
      if (_.includes(removeLinks, `${p.author}/${p.permlink}`)) {
        p.hasRemoveUpdate = true;
      }
    });
  }

  return { posts };
};

// Make condition for database aggregation using newsFilter if it exist, else only by "wobject"
const getWobjFeedCondition = async ({
  author_permlink, user_languages, removeFilter,
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
      condition, wObject, newsPermlink, app, author_permlink, removeFilter,
    });
  }

  condition['wobjects.author_permlink'] = { $in: _.compact([author_permlink, ...groupIdPermlinks]) };
  if (!_.isEmpty(removeFilter)) condition.$nor = removeFilter;
  return { condition };
};

const getNewsFilterCondition = ({
  condition, wObject, newsPermlink, app, author_permlink, removeFilter,
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
  if (!_.isEmpty(removeFilter)) condition.$nor = removeFilter;

  return { condition };
};

const getRemoveFilter = (processedObj) => _.chain([
  ...(processedObj.remove || []),
  ..._.map(getPinFilter(processedObj), (el) => `${el.author}/${el.permlink}`),
])
  .compact()
  .uniq()
  .map((el) => {
    const [author, permlink] = el.split('/');
    return { author, permlink };
  })
  .value();

const getPinFilter = (processedObj) => {
  const filteredPinBody = _.difference(_.map(processedObj.pin, 'body'), processedObj.remove);

  return _.chain(processedObj.pin)
    .filter((el) => _.includes(filteredPinBody, el.body))
    .sort(wObjectHelper.arrayFieldsSpecialSort)
    .take(3)
    .map((el) => {
      const [author, permlink] = el.body.split('/');
      return { author, permlink };
    })
    .value();
};
