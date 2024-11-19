/* eslint-disable camelcase */
const {
  Wobj, hiddenPostModel, mutedUserModel, Post,
} = require('models');
const { FIELDS_NAMES, OBJECT_TYPES, WALLET_ADDRESS_LINKED_TYPES } = require('constants/wobjectsData');
const { TOKEN } = require('constants/common');
const wObjectHelper = require('utilities/helpers/wObjectHelper');
const jsonHelper = require('utilities/helpers/jsonHelper');
const _ = require('lodash');

const getRelistedLinks = async (authorPermlink) => {
  const relisted = await Wobj.findRelistedObjectsByPermlink(authorPermlink);
  return relisted.map((el) => el?.author_permlink);
};

const POST_RETRIEVER = {
  REGULAR: 'REGULAR',
  FEED: 'FEED',
};

const postsQuery = {
  [POST_RETRIEVER.REGULAR]: Post.getWobjectPosts,
  [POST_RETRIEVER.FEED]: Post.getWobjectPosts,
  // [POST_RETRIEVER.FEED]: Post.getNewsFeedPosts,
};

const getPostRetriever = (data) => {
  if (data.newsPermlink) return postsQuery[POST_RETRIEVER.FEED];
  return postsQuery[POST_RETRIEVER.REGULAR];
};

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
    fields: [
      FIELDS_NAMES.NEWS_FEED,
      FIELDS_NAMES.GROUP_ID,
      FIELDS_NAMES.PIN,
      FIELDS_NAMES.REMOVE,
      FIELDS_NAMES.WALLET_ADDRESS,
      FIELDS_NAMES.LINK,
    ],
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

  const pinnedLinksCurrentUser = wObjectHelper
    .getCurrentUserPins({ object: wObject, userName: data.userName });

  const removeFilter = [
    ...wObjectHelper.getPinFilter(processedObj, pinnedLinksCurrentUser),
    ..._.map(processedObj.remove, (el) => {
      const [author, permlink] = el.split('/');
      return { author, permlink };
    }),
  ];

  const relistedLinks = await getRelistedLinks(data.author_permlink);

  const { condition, error: conditionError } = await getWobjFeedCondition({
    ...data,
    hiddenPosts,
    muted:
      _.map(muted, 'userName'),
    wObject,
    groupIdPermlinks,
    removeFilter,
    relistedLinks,
    processedObj,
  });

  if (conditionError) return { error: conditionError };

  const retriever = getPostRetriever(data);

  const { posts, error } = await retriever({
    condition,
    limit: data.limit,
    skip: data.skip,
    app: data.app,
  });

  if (error) return { error };

  if (!_.isEmpty(pinnedLinks) || !_.isEmpty(removeLinks)) {
    _.forEach(posts, (p) => {
      const pinnedInFeed = _.find(
        processedObj.pin,
        (pin) => pin.body === `${p.author}/${p.permlink}`,
      );
      if (pinnedInFeed) {
        p.pin = true;
      }

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

const makeConditionForLink = ({ condition, wObject }) => {
  const urlField = wObject.fields?.find((el) => el.name === FIELDS_NAMES.URL);
  if (!urlField) return { condition };
  const { body } = urlField;

  // when body ends with * it means that al path after * is valid, if no * - strict eq
  const condition2 = {
    links: body.endsWith('*') ? { $regex: `^${body.slice(0, -1)}` } : body,
    ..._.omit(condition, 'wobjects.author_permlink'),
  };

  return { condition: { $or: [condition, condition2] } };
};

const socialLinksMap = {
  linkFacebook: 'https://www.facebook.com/profile.php?id=',
  linkTwitter: 'https://x.com/',
  linkYouTube: 'https://www.youtube.com/@',
  linkInstagram: 'https://www.instagram.com/',
  linkGitHub: 'https://github.com/',
  linkTikTok: 'https://www.tiktok.com/@',
};

const makeSocialLink = (key, id) => `${socialLinksMap[key]}${id}`;

const makeConditionForPerson = ({ condition, processedObj }) => {
  if (!processedObj.link) return { condition };
  const parsedCondition = jsonHelper.parseJson(processedObj.link, null);
  if (!parsedCondition) return { condition };

  const conditionArr = [];

  for (const parsedConditionKey in parsedCondition) {
    const id = parsedCondition[parsedConditionKey];
    const keyExist = !!socialLinksMap[parsedConditionKey];
    if (id && keyExist) {
      const link = makeSocialLink(parsedConditionKey, id);

      const escapedLink = link.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape special regex characters
      const regex = new RegExp(`^${escapedLink}`);

      conditionArr.push({ links: { $regex: regex } });
    }
  }
  if (!conditionArr?.length) return { condition };

  return { condition: { $or: [condition, ...conditionArr] } };
};

// here we can either take fields from processed object or get all fields with Hive
const makeConditionForBusiness = ({ condition, processedObj }) => {
  const hiveWallets = (processedObj[FIELDS_NAMES.WALLET_ADDRESS] || []).reduce((acc, el) => {
    const walletObj = jsonHelper.parseJson(el.body);
    if (!walletObj) return acc;
    if (![TOKEN.HIVE, TOKEN.HBD].includes(walletObj.symbol)) return acc;
    acc.push(walletObj.address);
    return acc;
  }, []);

  if (!hiveWallets?.length) return { condition };
  const condition2 = {
    mentions: { $in: _.uniq(hiveWallets) },
    ..._.omit(condition, 'wobjects.author_permlink'),
  };

  return { condition: { $or: [condition, condition2] } };
};

// Make condition for database aggregation using newsFilter if it exist, else only by "wobject"
const getWobjFeedCondition = async ({
  author_permlink,
  user_languages,
  removeFilter,
  hiddenPosts,
  muted,
  newsPermlink,
  app,
  wObject,
  groupIdPermlinks,
  relistedLinks,
  processedObj,
}) => {
  const condition = {
    blocked_for_apps: { $ne: _.get(app, 'host') },
    reblog_to: null,
  };

  if (!_.isEmpty(hiddenPosts)) {
    condition._id
      ? Object.assign(condition._id, { $nin: hiddenPosts })
      : condition._id = { $nin: hiddenPosts };
  }
  if (!_.isEmpty(muted)) condition.author = { $nin: muted };
  // show posts with user languages only with hashtags type
  if (!_.isEmpty(user_languages) && wObject.object_type === OBJECT_TYPES.HASHTAG) {
    condition.language = { $in: user_languages };
  }

  if (newsPermlink) {
    return getNewsFilterCondition({
      condition, wObject, newsPermlink, app, author_permlink, removeFilter,
    });
  }
  condition['wobjects.author_permlink'] = { $in: _.compact([author_permlink, ...groupIdPermlinks, ...relistedLinks]) };
  if (!_.isEmpty(removeFilter)) condition.$nor = removeFilter;
  if (wObject.object_type === OBJECT_TYPES.PERSON) {
    return makeConditionForPerson({ condition, processedObj });
  }

  if (wObject.object_type === OBJECT_TYPES.LINK) {
    return makeConditionForLink({ condition, wObject });
  }

  if (WALLET_ADDRESS_LINKED_TYPES.includes(wObject.object_type)) {
    return makeConditionForBusiness({ condition, processedObj });
  }
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
    if (app.inherited && app?.supported_objects?.length) typeCondition.$and.push({ 'wobjects.author_permlink': { $in: _.get(app, 'supported_objects') } });

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
    delete condition.reblog_to;
  }

  condition.$and = _.compact([firstCond, secondCond]);
  if (!_.isEmpty(removeFilter)) condition.$nor = removeFilter;

  return { condition };
};
