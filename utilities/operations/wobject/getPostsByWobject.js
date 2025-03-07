/* eslint-disable camelcase */
const _ = require('lodash');
const {
  Wobj, hiddenPostModel, mutedUserModel, Post,
} = require('../../../models');
const { FIELDS_NAMES, OBJECT_TYPES, WALLET_ADDRESS_LINKED_TYPES } = require('../../../constants/wobjectsData');
const { TOKEN } = require('../../../constants/common');
const wObjectHelper = require('../../helpers/wObjectHelper');
const jsonHelper = require('../../helpers/jsonHelper');

const getRelistedLinks = async (authorPermlink) => {
  const relisted = await Wobj.findRelistedObjectsByPermlink(authorPermlink);
  return relisted.map((el) => el?.author_permlink);
};

const makeEscapedRegex = (link) => {
  const escapedLink = link.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Escape special regex characters
  return new RegExp(`^${escapedLink}`);
};

const POST_RETRIEVER = {
  REGULAR: 'REGULAR',
  FEED: 'FEED',
};

const postsQuery = {
  [POST_RETRIEVER.REGULAR]: Post.getWobjectPosts,
  [POST_RETRIEVER.FEED]: Post.getNewsFeedPosts,
};

const getPostRetriever = ({ data, wObject }) => {
  if (data.newsPermlink) {
    const newsFilter = JSON.parse(_.get(
      _.find(wObject.fields, (f) => f.permlink === data.newsPermlink),
      'body',
      '{}',
    ));
    if (!_.isEmpty(newsFilter.typeList)) return postsQuery[POST_RETRIEVER.FEED];
    return postsQuery[POST_RETRIEVER.REGULAR];
  }
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

  const retriever = getPostRetriever({ data, wObject });

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

  const initialLink = body.endsWith('*') ? body.slice(0, -1) : body;
  const regex = makeEscapedRegex(initialLink);

  return {
    condition: {
      $or: [
        _.pick(condition, 'wobjects.author_permlink'),
        {
          links: { $regex: regex },
        },
      ],
      ..._.omit(condition, 'wobjects.author_permlink'),
    },
  };
};

const socialLinksMap = {
  linkFacebook: 'https://www.facebook.com/profile.php?id=',
  linkTwitter: 'https://x.com/',
  linkYouTube: 'https://www.youtube.com/@',
  linkInstagram: 'https://www.instagram.com/',
  linkGitHub: 'https://github.com/',
  linkTikTok: 'https://www.tiktok.com/@',
  linkSnapchat: 'https://www.snapchat.com/add/',
};

const makeSocialLink = (key, id) => `${socialLinksMap[key]}${id}`;

const makeConditionSocialLink = ({ processedObj }) => {
  const conditionArr = [];
  if (!processedObj.link) return conditionArr;
  const parsedCondition = jsonHelper.parseJson(processedObj.link, null);
  if (!parsedCondition) return conditionArr;

  for (const parsedConditionKey in parsedCondition) {
    const id = parsedCondition[parsedConditionKey];
    const keyExist = !!socialLinksMap[parsedConditionKey];
    if (id && keyExist) {
      const link = makeSocialLink(parsedConditionKey, id);
      const regex = makeEscapedRegex(link);

      conditionArr.push({ links: { $regex: regex } });
      if (socialLinksMap[parsedConditionKey] === socialLinksMap.linkFacebook) {
        conditionArr.push({ links: { $regex: makeEscapedRegex(`https://www.facebook.com/${id}`) } });
      }
    }
  }

  return conditionArr;
};

// here we can either take fields from processed object or get all fields with Hive
const makeConditionForBusiness = ({ condition, processedObj }) => {
  const condArray = [{
    'wobjects.author_permlink': condition['wobjects.author_permlink'],
  }];
  const linkCondition = makeConditionSocialLink({ processedObj });
  if (linkCondition?.length) condArray.push(...linkCondition);

  const hiveWallets = (processedObj[FIELDS_NAMES.WALLET_ADDRESS] || []).reduce((acc, el) => {
    const walletObj = jsonHelper.parseJson(el.body);
    if (!walletObj) return acc;
    if (![TOKEN.HIVE, TOKEN.HBD].includes(walletObj.symbol)) return acc;
    acc.push(walletObj.address);
    return acc;
  }, []);

  if (hiveWallets?.length) {
    condArray.push({
      mentions: { $in: _.uniq(hiveWallets) },
    });
  }

  return {
    condition: {
      ..._.omit(condition, 'wobjects.author_permlink'),
      $or: condArray,
    },
  };
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

  const allowList = _.filter(newsFilter.allowList, (el) => !_.isEmpty(el));

  if (!_.isEmpty(allowList)) {
    const orCondArr = [];

    allowList.forEach((allowRule) => {
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
    _.some(allowList, (rule) => _.isEmpty(rule))
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
