const {
  REQUIREDFIELDS_PARENT, MIN_PERCENT_TO_SHOW_UPGATE, VOTE_STATUSES, OBJECT_TYPES, REQUIREDFILDS_WOBJ_LIST,
  ADMIN_ROLES, categorySwitcher, FIELDS_NAMES, ARRAY_FIELDS, INDEPENDENT_FIELDS, LIST_TYPES, FULL_SINGLE_FIELDS,
  AFFILIATE_TYPE, AMAZON_PRODUCT_IDS, AMAZON_LINKS_BY_COUNTRY, WALMART_PRODUCT_IDS, TARGET_PRODUCT_IDS,
} = require('constants/wobjectsData');
const { postsUtil } = require('utilities/hiveApi');
const ObjectTypeModel = require('models/ObjectTypeModel');
const blacklistModel = require('models/blacklistModel');
const UserWobjects = require('models/UserWobjects');
const { DEVICE, LANGUAGES_POPULARITY } = require('constants/common');
const { getNamespace } = require('cls-hooked');
const Wobj = require('models/wObjectModel');
const mutedModel = require('models/mutedUserModel');
const AppAffiliateModel = require('models/AppAffiliateModel');
const moment = require('moment');
const _ = require('lodash');
const config = require('config');
const { getWaivioAdminsAndOwner } = require('./getWaivioAdminsAndOwnerHelper');
const jsonHelper = require('./jsonHelper');
const { REMOVE_OBJ_STATUSES } = require('../../constants/wobjectsData');

const getBlacklist = async (admins) => {
  let followList = [];
  let resultBlacklist = [];
  if (_.isEmpty(admins)) return resultBlacklist;

  const { blackLists } = await blacklistModel
    .find({ user: { $in: admins } }, { followLists: 1, blackList: 1 });

  _.forEach(blackLists, (el) => {
    followList = _.union(followList, el.followLists);
    resultBlacklist = _.union(resultBlacklist, el.blackList);
  });
  const { result: muted } = await mutedModel.find({
    condition: { mutedBy: { $in: admins } },
    select: { userName: 1 },
  });

  resultBlacklist.push(..._.map(muted, (m) => m.userName));
  if (_.isEmpty(followList)) return resultBlacklist;

  const { blackLists: fromFollows } = await blacklistModel
    .find({ user: { $in: followList } }, { blackList: 1 });

  _.forEach(fromFollows, (el) => {
    resultBlacklist = _.union(resultBlacklist, el.blackList);
  });
  return resultBlacklist;
};
// eslint-disable-next-line camelcase
const getUserSharesInWobj = async (name, author_permlink) => {
  const userObjectShare = await UserWobjects.findOne({ user_name: name, author_permlink }, '-_id weight');

  return _.get(userObjectShare, 'weight') || 0;
};

const getWobjectFields = async (permlink) => {
  const { result } = await Wobj.findOne({ author_permlink: permlink });
  if (!result) return { error: { status: 404, message: 'Wobject not found' } };
  return { wobject: result };
};

const calculateApprovePercent = (field) => {
  if (_.isEmpty(field.active_votes)) return 100;
  if (field.adminVote) return field.adminVote.status === VOTE_STATUSES.APPROVED ? 100 : 0;
  if (field.weight < 0) return 0;

  const rejectsWeight = _.sumBy(field.active_votes, (vote) => {
    if (vote.percent < 0) {
      return -(+vote.weight || -1);
    }
  }) || 0;
  const approvesWeight = _.sumBy(field.active_votes, (vote) => {
    if (vote.percent > 0) {
      return +vote.weight || 1;
    }
  }) || 0;
  if (!rejectsWeight) return 100;
  const percent = _.round((approvesWeight / (approvesWeight + rejectsWeight)) * 100, 3);
  return percent > 0 ? percent : 0;
};

/** We have some types of admins at wobject, in this method we find admin role type */
const getFieldVoteRole = (vote) => {
  let role = ADMIN_ROLES.ADMIN;
  vote.ownership ? role = ADMIN_ROLES.OWNERSHIP : null;
  vote.administrative ? role = ADMIN_ROLES.ADMINISTRATIVE : null;
  vote.owner ? role = ADMIN_ROLES.OWNER : null;
  return role;
};

const addDataToFields = ({
  fields, filter, admins, ownership, administrative, isOwnershipObj, owner, blacklist = [],
}) => {
  /** Filter, if we need not all fields */
  if (filter) fields = _.filter(fields, (field) => _.includes(filter, field.name));

  for (const field of fields) {
    // recount field weight and filter votes if black list not empty
    if (!_.isEmpty(blacklist) && !_.isEmpty(field.active_votes)) {
      field.active_votes = _.filter(field.active_votes, (o) => !_.includes(blacklist, o.voter));
      field.weight = 1 + _.sumBy(field.active_votes, (vote) => vote.weight);
    }
    let adminVote, administrativeVote, ownershipVote, ownerVote;
    _.map(field.active_votes, (vote) => {
      vote.timestamp = vote._id.getTimestamp().valueOf();
      if (vote.voter === owner) {
        vote.owner = true;
        ownerVote = vote;
      } else if (_.includes(admins, vote.voter)) {
        vote.admin = true;
        vote.timestamp > _.get(adminVote, 'timestamp', 0) ? adminVote = vote : null;
      } else if (_.includes(administrative, vote.voter)) {
        vote.administrative = true;
        vote.timestamp > _.get(administrativeVote, 'timestamp', 0) ? administrativeVote = vote : null;
      } else if (isOwnershipObj && _.includes(ownership, vote.voter)) {
        vote.ownership = true;
        vote.timestamp > _.get(ownershipVote, 'timestamp', 0) ? ownershipVote = vote : null;
      }
    });
    if (_.has(field, '_id')) field.createdAt = field._id.getTimestamp().valueOf();
    /** If field includes admin votes fill in it */
    if (ownerVote || adminVote || administrativeVote || ownershipVote) {
      const mainVote = ownerVote || adminVote || ownershipVote || administrativeVote;
      field.adminVote = {
        role: getFieldVoteRole(mainVote),
        status: mainVote.percent > 0 ? VOTE_STATUSES.APPROVED : VOTE_STATUSES.REJECTED,
        name: mainVote.voter,
        timestamp: mainVote.timestamp,
      };
    }
    field.approvePercent = calculateApprovePercent(field);
  }
  return fields;
};

const specialFieldFilter = (idField, allFields, id) => {
  if (!idField.adminVote && idField.weight < 0) return null;
  idField.items = [];
  const filteredItems = _.filter(allFields[categorySwitcher[id]],
    (item) => item.id === idField.id && _.get(item, 'adminVote.status') !== VOTE_STATUSES.REJECTED);

  for (const itemField of filteredItems) {
    if (!idField.adminVote && itemField.weight < 0) continue;
    idField.items.push(itemField);
  }
  return idField;
};

const arrayFieldPush = ({ filter, field }) => {
  if (_.includes(filter, FIELDS_NAMES.GALLERY_ALBUM)) return false;
  if (_.get(field, 'adminVote.status') === VOTE_STATUSES.APPROVED) return true;
  if (field.weight > 0 && field.approvePercent > MIN_PERCENT_TO_SHOW_UPGATE) {
    return true;
  }
  return false;
};

const arrayFieldsSpecialSort = (a, b) => {
  if (!!a.adminVote && !!b.adminVote) return b._id - a._id;
  if (!!a.adminVote || !!b.adminVote) return !!b.adminVote - !!a.adminVote;
  return b.weight - a.weight;
};

const arrayFieldFilter = ({
  idFields, allFields, filter, id, permlink,
}) => {
  const validFields = [];
  for (const field of idFields) {
    if (_.get(field, 'adminVote.status') === VOTE_STATUSES.REJECTED) continue;
    switch (id) {
      case FIELDS_NAMES.TAG_CATEGORY:
      case FIELDS_NAMES.GALLERY_ALBUM:
        validFields.push(specialFieldFilter(field, allFields, id));
        break;
      case FIELDS_NAMES.RATING:
      case FIELDS_NAMES.PHONE:
      case FIELDS_NAMES.BUTTON:
      case FIELDS_NAMES.BLOG:
      case FIELDS_NAMES.FORM:
      case FIELDS_NAMES.GALLERY_ITEM:
      case FIELDS_NAMES.LIST_ITEM:
      case FIELDS_NAMES.NEWS_FILTER:
      case FIELDS_NAMES.COMPANY_ID:
      case FIELDS_NAMES.PRODUCT_ID:
      case FIELDS_NAMES.OPTIONS:
      case FIELDS_NAMES.AUTHORS:
      case FIELDS_NAMES.DEPARTMENTS:
      case FIELDS_NAMES.FEATURES:
      case FIELDS_NAMES.AUTHORITY:
      case FIELDS_NAMES.PIN:
        if (arrayFieldPush({ filter, field })) validFields.push(field);
        break;
      case FIELDS_NAMES.GROUP_ID:
      case FIELDS_NAMES.REMOVE:
        if (arrayFieldPush({ filter, field })) validFields.push(field.body);
        break;
      default:
        break;
    }
  }

  return { result: _.compact(validFields), id };
};

const filterFieldValidation = (filter, field, locale, ownership) => {
  field.locale === 'auto' ? field.locale = 'en-US' : null;
  let result = _.includes(INDEPENDENT_FIELDS, field.name) || locale === field.locale;
  if (filter) result = result && _.includes(filter, field.name);
  if (ownership) {
    result = result && _.includes(
      [ADMIN_ROLES.OWNERSHIP, ADMIN_ROLES.ADMIN, ADMIN_ROLES.OWNER], _.get(field, 'adminVote.role'),
    );
  }
  return result;
};

const getLangByPopularity = (existedLanguages) => {
  const filtered = _.filter(
    LANGUAGES_POPULARITY,
    (l) => _.includes(existedLanguages, l.lang),
  );
  const found = _.minBy(filtered, 'score');
  if (!found) return 'en-US';
  return found.lang;
};

/**
 * the method sorts the fields by name, then for each individual type checks if there are fields
 * with the requested locale, if there are - processes them if not, requests the English locale
 * @param fields {[Object]}
 * @param locale {String}
 * @param filter {[String]}
 * @param ownership {[String]}
 * @returns {[Object]}
 */
const getFilteredFields = (fields, locale, filter, ownership) => {
  const fieldsLanguages = [];

  const fieldTypes = _.reduce(fields, (acc, el) => {
    const conditionLocale = _.get(el, 'adminVote.status') === VOTE_STATUSES.APPROVED
      || el.weight > 0;

    if (_.has(acc, `${el.name}`)) {
      const locales = _.find(fieldsLanguages, (l) => l.type === el.name);
      if (!locales && conditionLocale) {
        fieldsLanguages.push({ type: el.name, languages: [el.locale] });
      }
      if (locales && !_.includes(locales.languages, el.locale) && conditionLocale) {
        locales.languages.push(el.locale);
      }

      acc[el.name].push(el);
      return acc;
    }
    if (conditionLocale) {
      fieldsLanguages.push({ type: el.name, languages: [el.locale] });
    }
    acc[el.name] = [el];
    return acc;
  }, {});

  return _.reduce(fieldTypes, (acc, el, index) => {
    const fieldLanguage = _.find(fieldsLanguages, (l) => l.type === index);
    const existedLanguages = _.get(fieldLanguage, 'languages', []);

    const nativeLang = _.filter(
      el,
      (field) => filterFieldValidation(filter, field, locale, ownership)
        && _.includes(existedLanguages, field.locale),
    );

    _.isEmpty(nativeLang)
      ? acc = [
        ...acc,
        ..._.filter(el, (field) => filterFieldValidation(
          filter,
          field,
          getLangByPopularity(existedLanguages),
          ownership,
        ))]
      : acc = [...acc, ...nativeLang];
    return acc;
  }, []);
};

const getSingleFieldsDisplay = (field) => {
  if (!field) return;
  if (FULL_SINGLE_FIELDS.includes(field.name)) return field;
  return field.body;
};

const getFieldsToDisplay = (fields, locale, filter, permlink, ownership) => {
  locale = locale === 'auto' ? 'en-US' : locale;
  const winningFields = {};
  const filteredFields = getFilteredFields(fields, locale, filter, ownership);

  if (!filteredFields.length) return {};

  const groupedFields = _.groupBy(filteredFields, 'name');
  for (const id of Object.keys(groupedFields)) {
    const approvedFields = _.filter(groupedFields[id],
      (field) => _.get(field, 'adminVote.status') === VOTE_STATUSES.APPROVED);

    if (_.includes(ARRAY_FIELDS, id)) {
      const { result, id: newId } = arrayFieldFilter({
        idFields: groupedFields[id], allFields: groupedFields, filter, id, permlink,
      });
      if (result.length) winningFields[newId] = result;
      continue;
    }

    if (approvedFields.length) {
      const ownerVotes = _.filter(approvedFields,
        (field) => field.adminVote.role === ADMIN_ROLES.OWNER);
      const adminVotes = _.filter(approvedFields,
        (field) => field.adminVote.role === ADMIN_ROLES.ADMIN);
      if (ownerVotes.length) winningFields[id] = getSingleFieldsDisplay(_.maxBy(ownerVotes, 'adminVote.timestamp'));
      else if (adminVotes.length) winningFields[id] = getSingleFieldsDisplay(_.maxBy(adminVotes, 'adminVote.timestamp'));
      else winningFields[id] = getSingleFieldsDisplay(_.maxBy(approvedFields, 'adminVote.timestamp'));
      continue;
    }
    const heaviestField = _.maxBy(groupedFields[id], (field) => {
      if (_.get(field, 'adminVote.status') !== 'rejected' && field.weight > 0
          && field.approvePercent > MIN_PERCENT_TO_SHOW_UPGATE) return field.weight;
    });
    if (heaviestField) winningFields[id] = getSingleFieldsDisplay(heaviestField);
  }
  return winningFields;
};

/** Get info of wobject parent with specific winning fields */
const getParentInfo = async ({
  locale, app, parent,
}) => {
  if (parent) {
    if (!parent) return '';
    parent = await processWobjects({
      locale, fields: REQUIREDFIELDS_PARENT, wobjects: [_.omit(parent, 'parent')], returnArray: false, app,
    });
  } else parent = '';
  return parent;
};

const fillObjectByExposedFields = async (obj, exposedFields) => {
  const { result } = await postsUtil.getPostState(
    { author: obj.author, permlink: obj.author_permlink, category: 'waivio-object' },
  );
  if (!result) {
    obj.fields = [];
  }
  obj.fields.map((field, index) => {
    /** if field not exist in object type for this object - remove it */
    if (!_.includes(exposedFields, field.name)) {
      delete obj.fields[index];
      return;
    }
    let post = _.get(result, `content['${field.author}/${field.permlink}']`);
    if (!post || !post.author) post = createMockPost(field);

    Object.assign(field,
      _.pick(post, ['children', 'total_pending_payout_value',
        'total_payout_value', 'pending_payout_value', 'curator_payout_value', 'cashout_time']));
    field.fullBody = post.body;
  });
  return obj;
};

const getLinkToPageLoad = (obj) => {
  if (getNamespace('request-session').get('device') === DEVICE.MOBILE) {
    return obj.object_type === OBJECT_TYPES.HASHTAG
      ? `/object/${obj.author_permlink}`
      : `/object/${obj.author_permlink}/about`;
  }
  if (_.get(obj, 'sortCustom', []).length) return getCustomSortLink(obj);

  switch (obj.object_type) {
    case OBJECT_TYPES.PAGE:
      return `/object/${obj.author_permlink}/page`;
    case OBJECT_TYPES.LIST:
      return `/object/${obj.author_permlink}/list`;
    case OBJECT_TYPES.BUSINESS:
    case OBJECT_TYPES.PRODUCT:
    case OBJECT_TYPES.SERVICE:
    case OBJECT_TYPES.COMPANY:
    case OBJECT_TYPES.PERSON:
    case OBJECT_TYPES.PLACE:
    case OBJECT_TYPES.HOTEL:
    case OBJECT_TYPES.RESTAURANT:
      return getDefaultLink(obj);
    case OBJECT_TYPES.WIDGET:
      return `/object/${obj.author_permlink}/widget`;
    case OBJECT_TYPES.NEWS_FEED:
      return `/object/${obj.author_permlink}/newsfeed`;
    default:
      return `/object/${obj.author_permlink}`;
  }
};

const getCustomSortLink = (obj) => {
  if (obj.object_type === OBJECT_TYPES.LIST) return `/object/${obj.author_permlink}/list`;

  const field = _.find(_.get(obj, 'listItem', []), { body: obj.sortCustom[0] });
  const blog = _.find(_.get(obj, 'blog', []), (el) => el.permlink === obj.sortCustom[0]);
  const news = _.find(_.get(obj, 'newsFilter', []), (el) => el.permlink === obj.sortCustom[0]);
  if (field) return `/object/${obj.author_permlink}/${field.type === 'menuPage' ? 'page' : 'menu'}#${field.body}`;
  if (blog) return `/object/${obj.author_permlink}/blog/@${blog.body}`;
  if (news) return `/object/${obj.author_permlink}/newsFilter/${news.permlink}`;

  return `/object/${obj.author_permlink}`;
};

const getDefaultLink = (obj) => {
  let listItem = _.get(obj, 'listItem', []);
  if (listItem.length) {
    _.find(listItem, (list) => list.type === 'menuList')
      ? listItem = _.filter(listItem, (list) => list.type === 'menuList')
      : null;
    const item = _
      .chain(listItem)
      .orderBy([(list) => _.get(list, 'adminVote.timestamp', 0), 'weight'], ['desc', 'desc'])
      .first()
      .value();
    return `/object/${obj.author_permlink}/${item.type === 'menuPage' ? 'page' : 'menu'}#${item.body}`;
  }
  if (_.get(obj, 'newsFilter', []).length) return `/object/${obj.author_permlink}/newsFilter/${obj.newsFilter[0].permlink}`;
  if (_.get(obj, 'blog', []).length) return `/object/${obj.author_permlink}/blog/@${obj.blog[0].body}`;

  return `/object/${obj.author_permlink}`;
};

const getTopTags = (obj, limit = 2) => {
  const tagCategories = _.get(obj, 'tagCategory', []);
  if (_.isEmpty(tagCategories)) return [];
  let tags = [];
  for (const tagCategory of tagCategories) {
    tags = _.concat(tags, tagCategory.items);
  }

  return _
    .chain(tags)
    .orderBy('weight', 'desc')
    .slice(0, limit)
    .map('body')
    .value();
};

const createMockPost = (field) => ({
  children: 0,
  total_pending_payout_value: '0.000 HBD',
  total_payout_value: '0.000 HBD',
  pending_payout_value: '0.000 HBD',
  curator_payout_value: '0.000 HBD',
  cashout_time: moment.utc().add(7, 'days').toDate(),
  body: `@${field.creator} added ${field.name} (${field.locale})`,
});

const getExposedFields = (objectType, fields) => {
  const exposedMap = new Map(
    _.get(objectType, 'exposedFields', Object.values(FIELDS_NAMES))
      .map((el) => [el, 0]),
  );
  if (exposedMap.has(FIELDS_NAMES.LIST_ITEM)) exposedMap.set(LIST_TYPES.MENU_PAGE, 0);

  for (const field of fields) {
    const value = exposedMap.get(field.name);

    if (field.name === FIELDS_NAMES.LIST_ITEM && field.type === LIST_TYPES.MENU_PAGE) {
      const listValue = exposedMap.get(field.type);
      exposedMap.set(field.type, (listValue || 0) + 1);
      continue;
    }
    if (value !== undefined) exposedMap.set(field.name, value + 1);
  }

  const exposedFieldsWithCounters = Array.from(exposedMap, ([name, value]) => ({ name, value }));
  exposedMap.clear();
  return exposedFieldsWithCounters;
};

const groupOptions = (options, obj) => _.chain(options)
  .map((option) => ({
    ...option,
    body: jsonHelper.parseJson(option.body),
    ...(obj && { author_permlink: obj.author_permlink, price: obj.price, avatar: obj.avatar }),
  })).groupBy(
    (option) => _.get(option, 'body.category'),
  ).value();

const addOptions = async ({
  object, ownership, admins, administrative, owner, blacklist, locale,
}) => {
  const filter = [
    FIELDS_NAMES.GROUP_ID,
    FIELDS_NAMES.OPTIONS,
    FIELDS_NAMES.PRICE,
    FIELDS_NAMES.AVATAR,
  ];

  const { result: wobjects } = await Wobj.findObjects({
    filter: {
      fields: {
        $elemMatch: {
          name: FIELDS_NAMES.GROUP_ID,
          body: { $in: object.groupId },
        },
      },
      'status.title': { $nin: REMOVE_OBJ_STATUSES },
    },
  });

  const options = _.reduce(wobjects, (acc, el) => {
    el.fields = addDataToFields({
      isOwnershipObj: !!ownership.length,
      fields: _.compact(el.fields),
      filter,
      admins,
      ownership,
      administrative,
      owner,
      blacklist,
    });
    Object.assign(el,
      getFieldsToDisplay(el.fields, locale, filter, el.author_permlink, !!ownership.length));

    const conditionToAdd = el.groupId
      && _.every(el.groupId, (gId) => _.includes(object.groupId, gId))
      && !_.isEmpty(el.options);

    if (conditionToAdd) {
      acc.push(..._.map(el.options, (opt) => ({
        ...opt,
        author_permlink: el.author_permlink,
        price: el.price,
        avatar: el.avatar,
      })));
    }
    return acc;
  }, []);

  return groupOptions(options);
};
/**
 * @returns {Promise<[{countryCode: string, type: string, host: string, affiliateCode: string }]>}
 */
const getAppAffiliateCodes = async ({ app, countryCode }) => {
  if (!app) return [];
  const { result } = await AppAffiliateModel.find(
    { filter: { host: app.host, countryCode } },
  );
  if (!_.isEmpty(result)) return result;
  if (app.host === config.appHost) return [];
  const { result: waivioAffiliate } = await AppAffiliateModel.find(
    { filter: { host: config.appHost, countryCode } },
  );
  return waivioAffiliate;
};

const formAmazonLink = ({ affiliateCodes, productId }) => {
  if (_.isEmpty(affiliateCodes)) return;
  const code = _.find(affiliateCodes, (aff) => aff.type === 'amazon');
  if (!code) return;
  const host = AMAZON_LINKS_BY_COUNTRY[code.countryCode];
  const link = `https://www.${host}/dp/${productId}/ref=nosim?tag=${code.affiliateCode}`;
  return { type: AFFILIATE_TYPE.AMAZON, link };
};

const formWalmartLink = ({ productId }) => {
  const link = `https://www.walmart.com/ip/${productId}`;
  return { type: AFFILIATE_TYPE.WALMART, link };
};

const formTargetLink = ({ productId }) => {
  const link = `https://www.target.com/p/${productId}`;
  return { type: AFFILIATE_TYPE.TARGET, link };
};

const formAffiliateLinks = ({ affiliateCodes, productIds }) => {
  const links = new Map();
  const mappedProductIds = _.map(productIds, (el) => {
    const body = jsonHelper.parseJson(el.body, {});
    if (!_.get(body, 'productIdType')) return;
    return {
      productId: body.productId,
      productIdType: body.productIdType,
    };
  });
  const code = _.find(affiliateCodes, (aff) => aff.type === 'amazon');
  const host = AMAZON_LINKS_BY_COUNTRY[_.get(code, 'countryCode', 'NONE')];
  const productIdObj = _.find(mappedProductIds, (id) => id.productIdType === host);
  if (productIdObj) {
    const link = formAmazonLink({ affiliateCodes, productId: productIdObj.productId });
    if (link) links.set(AFFILIATE_TYPE.AMAZON, link);
  }
  for (const mappedProductId of mappedProductIds) {
    const { productId, productIdType } = mappedProductId;
    if (_.includes(AMAZON_PRODUCT_IDS, productIdType.toLocaleLowerCase())
      && !links.has(AFFILIATE_TYPE.AMAZON)) {
      const link = formAmazonLink({ affiliateCodes, productId });
      if (link) links.set(AFFILIATE_TYPE.AMAZON, link);
    }
    if (_.includes(WALMART_PRODUCT_IDS, productIdType.toLocaleLowerCase())
      && !links.has(AFFILIATE_TYPE.WALMART)) {
      const link = formWalmartLink({ productId });
      if (link) links.set(AFFILIATE_TYPE.WALMART, link);
    }
    if (_.includes(TARGET_PRODUCT_IDS, productIdType.toLocaleLowerCase())
      && !links.has(AFFILIATE_TYPE.TARGET)) {
      const link = formTargetLink({ productId });
      if (link) links.set(AFFILIATE_TYPE.TARGET, link);
    }
  }

  return Array.from(links, ([, value]) => ({ ...value }));
};

/** Parse wobjects to get its winning */
const processWobjects = async ({
  wobjects, fields, hiveData = false, locale = 'en-US',
  app, returnArray = true, topTagsLimit, countryCode, reqUserName,
}) => {
  const filteredWobj = [];
  if (!_.isArray(wobjects)) return filteredWobj;
  let parents = [];
  const parentPermlinks = _.chain(wobjects).map('parent').compact().uniq()
    .value();
  if (parentPermlinks.length) {
    ({ result: parents } = await Wobj.find({ author_permlink: { $in: parentPermlinks } }));
  }
  const affiliateCodes = await getAppAffiliateCodes({ app, countryCode });

  for (let obj of wobjects) {
    let exposedFields = [];
    obj.parent = '';
    if (obj.newsFilter) obj = _.omit(obj, ['newsFilter']);

    /** Get waivio admins and owner */
    const waivioAdmins = await getWaivioAdminsAndOwner();

    /** Get app admins, wobj administrators, which was approved by app owner(creator) */
    const owner = _.get(app, 'owner');
    const admins = _.get(app, 'admins', []);
    const ownership = _.intersection(
      _.get(obj, 'authority.ownership', []), _.get(app, 'authority', []),
    );
    const administrative = _.intersection(
      _.get(obj, 'authority.administrative', []), _.get(app, 'authority', []),
    );
    const blacklist = await getBlacklist(_.uniq([owner, ...admins, ...waivioAdmins]));
    /** If flag hiveData exists - fill in wobj fields with hive data */
    if (hiveData) {
      const { objectType } = await ObjectTypeModel.getOne({ name: obj.object_type });
      exposedFields = getExposedFields(objectType, obj.fields);
    }

    obj.fields = addDataToFields({
      isOwnershipObj: !!ownership.length,
      fields: _.compact(obj.fields),
      filter: fields,
      admins,
      ownership,
      administrative,
      owner,
      blacklist,
    });
    /** Omit map, because wobject has field map, temp solution? maybe field map in wobj not need */
    obj = _.omit(obj, ['map']);
    Object.assign(obj,
      getFieldsToDisplay(obj.fields, locale, fields, obj.author_permlink, !!ownership.length));
    /** Get right count of photos in object in request for only one object */
    if (!fields) {
      obj.albums_count = _.get(obj, FIELDS_NAMES.GALLERY_ALBUM, []).length;
      obj.photos_count = _.get(obj, FIELDS_NAMES.GALLERY_ITEM, []).length;
      obj.preview_gallery = _.orderBy(
        _.get(obj, FIELDS_NAMES.GALLERY_ITEM, []), ['weight'], ['desc'],
      );
      if (obj.avatar) {
        obj.preview_gallery.unshift({
          body: obj.avatar,
          name: FIELDS_NAMES.AVATAR,
          id: obj.author_permlink,
        });
      }
      if (obj.options || obj.groupId) {
        obj.options = obj.groupId
          ? await addOptions({
            object: obj, ownership, admins, administrative, owner, blacklist, locale,
          })
          : groupOptions(obj.options, obj);
      }
    }

    if ((obj.options || obj.groupId) && _.includes(fields, FIELDS_NAMES.OPTIONS)) {
      obj.options = obj.groupId
        ? await addOptions({
          object: obj, ownership, admins, administrative, owner, blacklist, locale,
        })
        : groupOptions(obj.options, obj);
    }

    if (obj.sortCustom) obj.sortCustom = JSON.parse(obj.sortCustom);
    if (obj.newsFilter) {
      obj.newsFilter = _.map(obj.newsFilter, (item) => _.pick(item, ['title', 'permlink', 'name']));
    }
    if (_.isString(obj.parent)) {
      const parent = _.find(parents, { author_permlink: obj.parent });
      obj.parent = await getParentInfo({ locale, app, parent });
    }
    if (obj.productId && obj.object_type !== OBJECT_TYPES.PERSON) {
      const affiliateLinks = formAffiliateLinks({ affiliateCodes, productIds: obj.productId });
      if (!_.isEmpty(affiliateLinks)) {
        obj.affiliateLinks = affiliateLinks;
        obj.website = null;
      }
    }
    if (obj.departments && typeof obj.departments[0] === 'string') {
      obj.departments = null;
    }
    obj.defaultShowLink = getLinkToPageLoad(obj);
    obj.exposedFields = exposedFields;
    obj.authority = _.find(obj.authority, (a) => a.creator === reqUserName);
    if (!hiveData) obj = _.omit(obj, ['fields', 'latest_posts', 'last_posts_counts_by_hours', 'tagCategories', 'children']);
    if (_.has(obj, FIELDS_NAMES.TAG_CATEGORY)) obj.topTags = getTopTags(obj, topTagsLimit);
    filteredWobj.push(obj);
  }
  if (!returnArray) return filteredWobj[0];
  return filteredWobj;
};

const getCurrentNames = async (names) => {
  const { result: wobjects } = await Wobj.find(
    { author_permlink: { $in: names } }, { author_permlink: 1, fields: 1 },
  );
  const result = await Promise.all(wobjects.map(async (wobject) => {
    const { name } = await processWobjects({
      wobjects: [wobject], fields: [FIELDS_NAMES.NAME], returnArray: false,
    });
    return { author_permlink: wobject.author_permlink, name };
  }));
  return { result };
};

const moderatePosts = async ({ posts, app, locale }) => {
  await Promise.all(posts.map(async (post) => {
    if (post.wobjects) {
      post.wobjects = await processWobjects({
        wobjects: post.wobjects,
        app,
        hiveData: false,
        returnArray: true,
        locale,
        fields: REQUIREDFILDS_WOBJ_LIST,
      });
    }
  }));
};

module.exports = {
  getUserSharesInWobj,
  getLinkToPageLoad,
  getWobjectFields,
  getCurrentNames,
  processWobjects,
  getParentInfo,
  fillObjectByExposedFields,
  calculateApprovePercent,
  addDataToFields,
  moderatePosts,
  arrayFieldsSpecialSort,
};
