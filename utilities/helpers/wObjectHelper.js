/* eslint-disable camelcase */
const {
  REQUIREDFIELDS_PARENT,
  MIN_PERCENT_TO_SHOW_UPGATE,
  VOTE_STATUSES,
  OBJECT_TYPES,
  REQUIREDFILDS_WOBJ_LIST,
  ADMIN_ROLES,
  categorySwitcher,
  FIELDS_NAMES,
  ARRAY_FIELDS,
  INDEPENDENT_FIELDS,
  LIST_TYPES,
  FULL_SINGLE_FIELDS,
} = require('constants/wobjectsData');
const { postsUtil } = require('utilities/hiveApi');
const ObjectTypeModel = require('models/ObjectTypeModel');
const blacklistModel = require('models/blacklistModel');
const UserWobjects = require('models/UserWobjects');
const {
  DEVICE,
  LANGUAGES_POPULARITY,
  TTL_TIME,
  REDIS_KEYS,
} = require('constants/common');
const { getNamespace } = require('cls-hooked');
const Wobj = require('models/wObjectModel');
const mutedModel = require('models/mutedUserModel');
const moment = require('moment');
const _ = require('lodash');
const makeAffiliateLinks = require('utilities/operations/affiliateProgram/makeAffiliateLinks');
const { getWaivioAdminsAndOwner } = require('./getWaivioAdminsAndOwnerHelper');
const jsonHelper = require('./jsonHelper');
const { REMOVE_OBJ_STATUSES } = require('../../constants/wobjectsData');
const {
  formAffiliateLinks,
  getAppAffiliateCodes,
} = require('./affiliateHelper');
const { SHOP_SETTINGS_TYPE } = require('../../constants/sitesConstants');
const {
  getCacheKey,
  getCachedData,
  setCachedData,
} = require('./cacheHelper');

const findFieldByBody = (fields, body) => _.find(fields, (f) => f.body === body);

const getBlacklist = async (admins) => {
  const key = `${REDIS_KEYS.API_RES_CACHE}:getBlacklist:${getCacheKey({ getBlacklist: admins })}`;
  const cache = await getCachedData(key);
  if (cache) return jsonHelper.parseJson(cache, []);

  let followList = [];
  let resultBlacklist = [];
  if (_.isEmpty(admins)) return resultBlacklist;

  const { blackLists } = await blacklistModel
    .find({ user: { $in: admins } }, {
      followLists: 1,
      blackList: 1,
    });

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

  const result = _.difference(resultBlacklist, admins);

  await setCachedData({
    key, data: result, ttl: TTL_TIME.THIRTY_MINUTES,
  });

  return result;
};
// eslint-disable-next-line camelcase
const getUserSharesInWobj = async (name, author_permlink) => {
  const userObjectShare = await UserWobjects.findOne({
    user_name: name,
    author_permlink,
  }, '-_id weight');

  return _.get(userObjectShare, 'weight') || 0;
};

const getWobjectFields = async (permlink) => {
  const { result } = await Wobj.findOne({ author_permlink: permlink });
  if (!result) {
    return {
      error: {
        status: 404,
        message: 'Wobject not found',
      },
    };
  }
  return { wobject: result };
};

const calculateApprovePercent = (field) => {
  if (field.adminVote) return field.adminVote.status === VOTE_STATUSES.APPROVED ? 100 : 0;
  if (field.weight <= 0) return 0;

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
  fields,
  filter,
  admins,
  ownership,
  administrative,
  isOwnershipObj,
  owner,
  blacklist = [],
}) => {
  /** Filter, if we need not all fields */
  if (filter) fields = _.filter(fields, (field) => _.includes(filter, field.name));

  for (const field of fields) {
    // recount field weight and filter votes if black list not empty
    field.weight += (field?.weightWAIV ?? 0);
    if (
      !_.isEmpty(blacklist)
      && !_.isEmpty(field.active_votes)
      && field.name !== FIELDS_NAMES.AUTHORITY
      && _.some(field.active_votes, (v) => _.includes(blacklist, v.voter))
    ) {
      field.active_votes = _.filter(field.active_votes, (o) => !_.includes(blacklist, o.voter));
      const weightHive = _.sumBy(field.active_votes, (vote) => vote.weight) || 0;
      const weightWaiv = _.sumBy(field.active_votes, (vote) => vote.weightWAIV) || 0;
      field.weight = weightHive + weightWaiv;
    }
    let adminVote, administrativeVote, ownershipVote, ownerVote;
    _.map(field.active_votes, (vote) => {
      vote.timestamp = vote._id
        ? vote._id.getTimestamp().valueOf()
        : Date.now();
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
    if (_.has(field, '_id')) {
      field.createdAt = field._id.getTimestamp()
        .valueOf();
    }
    /** If field includes admin votes fill in it */
    if (ownerVote || adminVote || administrativeVote || ownershipVote) {
      const mainVote = ownerVote || adminVote || ownershipVote || administrativeVote;
      if (mainVote.percent !== 0) {
        field.adminVote = {
          role: getFieldVoteRole(mainVote),
          status: mainVote.percent > 0 ? VOTE_STATUSES.APPROVED : VOTE_STATUSES.REJECTED,
          name: mainVote.voter,
          timestamp: mainVote.timestamp,
        };
      }
    }
    field.approvePercent = calculateApprovePercent(field);
  }
  return fields;
};

const specialFieldFilter = (idField, allFields, id) => {
  if (!idField.adminVote && idField.weight < 0) return null;
  idField.items = [];
  const filteredItems = _.filter(
    allFields[categorySwitcher[id]],
    (item) => item.id === idField.id && _.get(item, 'adminVote.status') !== VOTE_STATUSES.REJECTED,
  );

  for (const itemField of filteredItems) {
    if (!idField.adminVote && itemField.weight < 0) continue;
    idField.items.push(itemField);
  }
  return idField;
};

const arrayFieldPush = ({
  filter,
  field,
}) => {
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
  idFields,
  allFields,
  filter,
  id,
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
      case FIELDS_NAMES.MENU_ITEM:
      case FIELDS_NAMES.ADD_ON:
      case FIELDS_NAMES.RELATED:
      case FIELDS_NAMES.SIMILAR:
      case FIELDS_NAMES.WALLET_ADDRESS:
      case FIELDS_NAMES.DELEGATION:
        if (arrayFieldPush({
          filter,
          field,
        })) {
          validFields.push(field);
        }
        break;
      case FIELDS_NAMES.GROUP_ID:
      case FIELDS_NAMES.REMOVE:
      case FIELDS_NAMES.AFFILIATE_GEO_AREA:
      case FIELDS_NAMES.AFFILIATE_PRODUCT_ID_TYPES:
      case FIELDS_NAMES.GROUP_ADD:
      case FIELDS_NAMES.GROUP_EXCLUDE:
        if (arrayFieldPush({
          filter,
          field,
        })) {
          validFields.push(field.body);
        }
        break;
      default:
        break;
    }
  }
  const result = _.compact(validFields);

  if (id === FIELDS_NAMES.DEPARTMENTS) {
    if (result.length > 10) {
      const sorted = _.orderBy(result, ['weight'], ['desc']);
      return {
        result: _.take(sorted, 10),
        id,
      };
    }
  }

  return {
    result,
    id,
  };
};

const filterFieldValidation = (filter, field, locale, ownership) => {
  field.locale === 'auto' ? field.locale = 'en-US' : null;
  let result = _.includes(INDEPENDENT_FIELDS, field.name) || locale === field.locale;
  if (filter) result = result && _.includes(filter, field.name);
  if (ownership?.length) {
    result = (result && _.includes([ADMIN_ROLES.OWNERSHIP, ADMIN_ROLES.ADMIN, ADMIN_ROLES.OWNER], _.get(field, 'adminVote.role')))
      || (result && _.includes(ownership, field?.creator));
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

const listItemsPick = ({ listItems, locale, index }) => {
  const result = [];
  const groupedItems = index === FIELDS_NAMES.LIST_ITEM
    ? _.groupBy(listItems, 'body')
    : _.groupBy(listItems.map((el) => {
      const parsedLink = jsonHelper.parseJson(el.body);
      const groupField = `${parsedLink?.linkToObject}${parsedLink?.style}`
        || `${parsedLink?.linkToWeb}${parsedLink?.style}`;
      return {
        ...el,
        groupField,
      };
    }), 'groupField');

  for (const item in groupedItems) {
    const ourLocale = groupedItems[item]
      .find((el) => arrayFieldPush({ field: el }) && el.locale === locale);
    if (ourLocale) {
      result.push(ourLocale);
      continue;
    }
    if (locale !== 'en-US') {
      const enLocale = groupedItems[item]
        .find((el) => arrayFieldPush({ field: el }) && el.locale === 'en-US');
      if (enLocale) {
        result.push(enLocale);
        continue;
      }
    }
    const maxWeightLocale = _.maxBy(groupedItems[item]
      .filter((el) => arrayFieldPush({ field: el })), 'weight');
    if (maxWeightLocale) result.push(maxWeightLocale);
  }

  return result;
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
        fieldsLanguages.push({
          type: el.name,
          languages: [el.locale],
        });
      }
      if (locales && !_.includes(locales.languages, el.locale) && conditionLocale) {
        locales.languages.push(el.locale);
      }

      acc[el.name].push(el);
      return acc;
    }
    if (conditionLocale) {
      fieldsLanguages.push({
        type: el.name,
        languages: [el.locale],
      });
    }
    acc[el.name] = [el];
    return acc;
  }, {});

  return _.reduce(fieldTypes, (acc, el, index) => {
    if ([FIELDS_NAMES.LIST_ITEM, FIELDS_NAMES.MENU_ITEM].includes(index)) {
      const items = listItemsPick({ listItems: el, locale, index });
      acc = [...acc, ...items];
      return acc;
    }

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

const setWinningFields = ({ id, winningField, winningFields }) => {
  winningFields[id] = getSingleFieldsDisplay(winningField);

  if (id === FIELDS_NAMES.DESCRIPTION) {
    winningFields.descriptionCreator = winningField.creator;
  }
};

const getFieldsToDisplay = (fields, locale, filter, permlink, ownership) => {
  locale = locale === 'auto' ? 'en-US' : locale;
  const winningFields = {};
  const filteredFields = getFilteredFields(fields, locale, filter, ownership);

  if (!filteredFields.length) return {};

  const groupedFields = _.groupBy(filteredFields, 'name');
  for (const id of Object.keys(groupedFields)) {
    const approvedFields = _.filter(
      groupedFields[id],
      (field) => _.get(field, 'adminVote.status') === VOTE_STATUSES.APPROVED,
    );

    if (_.includes(ARRAY_FIELDS, id)) {
      const {
        result,
        id: newId,
      } = arrayFieldFilter({
        idFields: groupedFields[id],
        allFields: groupedFields,
        filter,
        id,
        permlink,
      });
      if (result.length) winningFields[newId] = result;
      continue;
    }
    // pick from admin fields
    if (approvedFields.length) {
      const ownerVotes = _.filter(
        approvedFields,
        (field) => field.adminVote.role === ADMIN_ROLES.OWNER,
      );
      const adminVotes = _.filter(
        approvedFields,
        (field) => field.adminVote.role === ADMIN_ROLES.ADMIN,
      );
      if (ownerVotes.length) {
        const winningField = _.maxBy(ownerVotes, 'adminVote.timestamp');
        winningFields[id] = getSingleFieldsDisplay(winningField);
        setWinningFields({ id, winningFields, winningField });
      } else if (adminVotes.length) {
        const winningField = _.maxBy(adminVotes, 'adminVote.timestamp');
        setWinningFields({ id, winningFields, winningField });
      } else {
        const winningField = _.maxBy(approvedFields, 'adminVote.timestamp');
        setWinningFields({ id, winningFields, winningField });
      }
      continue;
    }
    // pick from heaviest field
    const winningField = _.maxBy(groupedFields[id], (field) => {
      if (_.get(field, 'adminVote.status') !== 'rejected' && field.weight > 0
        && field.approvePercent > MIN_PERCENT_TO_SHOW_UPGATE) {
        return field.weight;
      }
    });
    if (winningField) setWinningFields({ id, winningFields, winningField });
  }
  return winningFields;
};

/** Get info of wobject parent with specific winning fields */
const getParentInfo = async ({
  locale,
  app,
  parent,
}) => {
  if (parent) {
    if (!parent) return '';
    parent = await processWobjects({
      locale,
      fields: REQUIREDFIELDS_PARENT,
      wobjects: [_.omit(parent, 'parent')],
      returnArray: false,
      app,
    });
  } else {
    parent = '';
  }
  return parent;
};

const fillObjectByExposedFields = async (obj, exposedFields) => {
  const { result } = await postsUtil.getPostState(
    {
      author: obj.author,
      permlink: obj.author_permlink,
      category: 'waivio-object',
    },
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

    Object.assign(
      field,
      _.pick(post, ['children', 'total_pending_payout_value',
        'total_payout_value', 'pending_payout_value', 'curator_payout_value', 'cashout_time']),
    );
    field.fullBody = post.body;
  });
  return obj;
};

const getLinkFromMenuItem = ({ mainObjectPermlink, menu }) => {
  const defaultLink = `/object/${mainObjectPermlink}`;
  const body = jsonHelper.parseJson(menu.body, null);
  if (!body) return defaultLink;
  if (!body.linkToObject) return defaultLink;
  const links = {
    [OBJECT_TYPES.LIST]: `/menu#${body.linkToObject}`,
    [OBJECT_TYPES.PAGE]: `/page#${body.linkToObject}`,
    [OBJECT_TYPES.NEWS_FEED]: `/newsfeed/${body.linkToObject}`,
    [OBJECT_TYPES.WIDGET]: `/widget#${body.linkToObject}`,
    default: '',
  };

  const linkEnding = links[body.objectType] || links.default;

  return `${defaultLink}${linkEnding}`;
};

const getLinkToPageLoad = (obj) => {
  if (getNamespace('request-session')
    .get('device') === DEVICE.MOBILE) {
    return obj.object_type === OBJECT_TYPES.HASHTAG
      ? `/object/${obj.author_permlink}`
      : `/object/${obj.author_permlink}/about`;
  }
  if (_.get(obj, 'sortCustom.include', []).length) return getCustomSortLink(obj);

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
    case OBJECT_TYPES.SHOP:
      return `/object/${obj.author_permlink}/shop`;
    case OBJECT_TYPES.WEB_PAGE:
      return `/object/${obj.author_permlink}/webpage`;
    case OBJECT_TYPES.MAP:
      return `/object/${obj.author_permlink}/map`;
    default:
      return `/object/${obj.author_permlink}`;
  }
};

const getCustomSortLink = (obj) => {
  if (obj.object_type === OBJECT_TYPES.LIST) return `/object/${obj.author_permlink}/list`;
  const defaultLink = `/object/${obj.author_permlink}`;

  const menu = _.find(obj?.menuItem, (el) => el.permlink === _.get(obj, 'sortCustom.include[0]'));
  if (menu) {
    return getLinkFromMenuItem({ mainObjectPermlink: obj.author_permlink, menu });
  }

  const field = _.find(_.get(obj, 'listItem', []), { body: _.get(obj, 'sortCustom.include[0]') });
  const blog = _.find(_.get(obj, 'blog', []), (el) => el.permlink === _.get(obj, 'sortCustom.include[0]'));
  const news = _.find(_.get(obj, 'newsFilter', []), (el) => el.permlink === _.get(obj, 'sortCustom.include[0]'));
  if (field) return `/object/${obj.author_permlink}/${field.type === 'menuPage' ? 'page' : 'menu'}#${field.body}`;
  if (blog) return `/object/${obj.author_permlink}/blog/@${blog.body}`;
  if (news) return `/object/${obj.author_permlink}/newsFilter/${news.permlink}`;

  return defaultLink;
};

const getDefaultLink = (obj) => {
  const defaultLink = `/object/${obj.author_permlink}`;
  const menu = _.find(obj?.menuItem, (el) => el.name === FIELDS_NAMES.MENU_ITEM);
  if (menu) {
    return getLinkFromMenuItem({ mainObjectPermlink: obj.author_permlink, menu });
  }
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

  return defaultLink;
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
  cashout_time: moment.utc()
    .add(7, 'days')
    .toDate(),
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

  const exposedFieldsWithCounters = Array.from(exposedMap, ([name, value]) => ({
    name,
    value,
  }));
  exposedMap.clear();
  return exposedFieldsWithCounters;
};

const groupOptions = (options, obj) => _.chain(options)
  .map((option) => ({
    ...option,
    body: jsonHelper.parseJson(option.body),
    ...(obj && {
      author_permlink: obj.author_permlink,
      price: obj.price,
      avatar: obj.avatar,
    }),
  }))
  .groupBy(
    (option) => _.get(option, 'body.category'),
  )
  .value();

const addOptions = async ({
  object,
  ownership,
  admins,
  administrative,
  owner,
  blacklist,
  locale,
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
    Object.assign(
      el,
      getFieldsToDisplay(el.fields, locale, filter, el.author_permlink, ownership),
    );

    const conditionToAdd = el.groupId
      && _.some(el.groupId, (gId) => _.includes(object.groupId, gId))
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
const getOwnerAndAdmins = (app) => {
  let owner = app?.owner;
  const admins = app?.admins ?? [];
  /** if owner add himself to admins means that he has same rights on object as admins */
  if (admins.includes(owner)) {
    owner = '';
  }

  return { owner, admins };
};

const filterAssignedAdmin = (admins, field) => field.name === FIELDS_NAMES.DELEGATION
  && admins.includes(field.creator);

const getAssignedAdmins = ({
  admins = [],
  owner,
  object,
  ownership,
  administrative,
  blacklist,
}) => {
  let fields = object?.fields?.filter((f) => filterAssignedAdmin([...admins, owner], f));
  if (!fields?.length) return [];

  fields = addDataToFields({
    isOwnershipObj: !!ownership.length,
    fields,
    filter: [FIELDS_NAMES.DELEGATION],
    admins,
    ownership,
    administrative,
    owner,
    blacklist,
  });

  const processed = getFieldsToDisplay(
    fields,
    'en-US',
    [FIELDS_NAMES.DELEGATION],
    object.author_permlink,
    ownership,
  );

  if (!processed[FIELDS_NAMES.DELEGATION]) return [];

  return processed[FIELDS_NAMES.DELEGATION].map((el) => el.body);
};

/** Parse wobjects to get its winning */
const processWobjects = async ({
  wobjects,
  fields,
  hiveData = false,
  locale = 'en-US',
  app,
  returnArray = true,
  topTagsLimit,
  countryCode,
  reqUserName,
  affiliateCodes = [],
}) => {
  const filteredWobj = [];
  if (!_.isArray(wobjects)) return filteredWobj;
  let parents = [];
  const parentPermlinks = _.chain(wobjects)
    .map('parent')
    .compact()
    .uniq()
    .value();
  if (parentPermlinks.length) {
    ({ result: parents } = await Wobj.find(
      { author_permlink: { $in: parentPermlinks } },
      { search: 0, departments: 0 },
    ));
  }
  const affiliateCodesOld = await getAppAffiliateCodes({ app, countryCode });

  /** Get waivio admins and owner */
  const waivioAdmins = await getWaivioAdminsAndOwner();
  const { owner, admins } = getOwnerAndAdmins(app);
  const blacklist = await getBlacklist(_.uniq([owner, ...admins, ...waivioAdmins]));
  // means that owner want's all objects on sites behave like ownership objects
  const objectControl = !!app?.objectControl;
  const userShop = app?.configuration?.shopSettings?.type === SHOP_SETTINGS_TYPE.USER;
  const extraAuthority = userShop
    ? app?.configuration?.shopSettings?.value
    : app?.owner;

  for (let obj of wobjects) {
    let exposedFields = [];
    obj.parent = '';
    if (obj.newsFilter) obj = _.omit(obj, ['newsFilter']);

    /** Get app admins, wobj administrators, which was approved by app owner(creator) */
    const ownership = _.intersection(_.get(obj, 'authority.ownership', []), _.get(app, 'authority', []));
    const administrative = _.intersection(_.get(obj, 'authority.administrative', []), _.get(app, 'authority', []));

    // get admins that can be assigned by owner or other admins
    const assignedAdmins = getAssignedAdmins({
      admins, ownership, administrative, owner, blacklist, object: obj,
    });
    const objectAdmins = [...admins, ...assignedAdmins];

    if (objectControl
      && (!_.isEmpty(administrative)
        || !_.isEmpty(ownership)
        || _.get(obj, 'authority.administrative', []).includes(extraAuthority)
        || _.get(obj, 'authority.ownership', []).includes(extraAuthority)
      )
    ) {
      ownership.push(extraAuthority, ...objectAdmins);
    }

    /** If flag hiveData exists - fill in wobj fields with hive data */
    if (hiveData) {
      // only if 1 object processed no need to refactor before for of
      const { objectType } = await ObjectTypeModel.getOne({ name: obj.object_type });
      exposedFields = getExposedFields(objectType, obj.fields);
    }

    obj.fields = addDataToFields({
      isOwnershipObj: !!ownership.length,
      fields: _.compact(obj.fields),
      filter: fields,
      admins: objectAdmins,
      ownership,
      administrative,
      owner,
      blacklist,
    });
    /** Omit map, because wobject has field map, temp solution? maybe field map in wobj not need */
    obj = _.omit(obj, ['map', 'search']);
    obj = {
      ...obj,
      ...getFieldsToDisplay(obj.fields, locale, fields, obj.author_permlink, ownership),
    };

    /** Get right count of photos in object in request for only one object */
    if (!fields) {
      obj.albums_count = _.get(obj, FIELDS_NAMES.GALLERY_ALBUM, []).length;
      obj.photos_count = _.get(obj, FIELDS_NAMES.GALLERY_ITEM, []).length;
      obj.preview_gallery = _.orderBy(_.get(obj, FIELDS_NAMES.GALLERY_ITEM, []), ['weight'], ['desc']);
      if (obj.avatar) {
        obj.preview_gallery.unshift({
          ...findFieldByBody(obj.fields, obj.avatar),
          id: obj.author_permlink,
        });
      }
      if (obj.options || obj.groupId) {
        obj.options = obj.groupId
          ? await addOptions({
            object: obj,
            ownership,
            admins: objectAdmins,
            administrative,
            owner,
            blacklist,
            locale,
          })
          : groupOptions(obj.options, obj);
      }
    }

    if ((obj.options || obj.groupId) && _.includes(fields, FIELDS_NAMES.OPTIONS)) {
      obj.options = obj.groupId
        ? await addOptions({
          object: obj,
          ownership,
          admins: objectAdmins,
          administrative,
          owner,
          blacklist,
          locale,
        })
        : groupOptions(obj.options, obj);
    }

    if (obj.sortCustom) obj.sortCustom = JSON.parse(obj.sortCustom);
    if (obj.newsFilter) {
      obj.newsFilter = _.map(obj.newsFilter, (item) => _.pick(item, ['title', 'permlink', 'name']));
    }
    if (_.isString(obj.parent)) {
      const parent = _.find(parents, { author_permlink: obj.parent });
      obj.parent = await getParentInfo({
        locale,
        app,
        parent,
      });
    }
    if (obj.productId && obj.object_type !== OBJECT_TYPES.PERSON) {
      if (affiliateCodes.length) {
        obj.affiliateLinks = makeAffiliateLinks({
          affiliateCodes,
          productIds: obj.productId,
          countryCode,
        });
      }
      if (!obj?.affiliateLinks?.length) {
        const affiliateLinks = formAffiliateLinks({
          affiliateCodes: affiliateCodesOld, productIds: obj.productId, countryCode,
        });
        if (!_.isEmpty(affiliateLinks)) {
          obj.affiliateLinks = affiliateLinks;
          obj.website = null;
        }
      }
    }
    if (obj.departments && typeof obj.departments[0] === 'string') {
      obj.departments = null;
    }
    obj.defaultShowLink = getLinkToPageLoad(obj);
    obj.exposedFields = exposedFields;
    obj.authority = _.find(
      obj.authority,
      (a) => a.creator === reqUserName && a.body === 'administrative',
    );
    if (!hiveData) obj = _.omit(obj, ['fields', 'latest_posts', 'last_posts_counts_by_hours', 'tagCategories', 'children']);
    if (_.has(obj, FIELDS_NAMES.TAG_CATEGORY)) obj.topTags = getTopTags(obj, topTagsLimit);
    filteredWobj.push(obj);
  }
  if (!returnArray) return filteredWobj[0];
  return filteredWobj;
};

const getCurrentNames = async (names) => {
  const { result: wobjects } = await Wobj.find({ author_permlink: { $in: names } }, {
    author_permlink: 1,
    fields: 1,
  });
  const result = await Promise.all(wobjects.map(async (wobject) => {
    const { name } = await processWobjects({
      wobjects: [wobject],
      fields: [FIELDS_NAMES.NAME],
      returnArray: false,
    });
    return {
      author_permlink: wobject.author_permlink,
      name,
    };
  }));
  return { result };
};

const moderatePosts = async ({
  posts,
  app,
  locale,
}) => {
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

const getPinFilter = (processedObj, pinnedLinksCurrentUser) => {
  const filteredPinBody = (processedObj?.pin ?? [])
    .filter((el) => !(processedObj?.remove ?? []).includes(el.body))
    .map((el) => el.body);

  const processedCurrentUser = filteredPinBody.filter((el) => pinnedLinksCurrentUser.includes(el));

  const othersPin = (processedObj?.pin ?? [])
    .filter((el) => filteredPinBody.includes(el.body) && !pinnedLinksCurrentUser.includes(el.body))
    .sort(arrayFieldsSpecialSort)
    .slice(0, 5)
    .map((el) => el.body);

  const resultLinks = [...processedCurrentUser, ...othersPin];

  return resultLinks.map((link) => {
    const [author, permlink] = link.split('/');
    return {
      author,
      permlink,
    };
  });
};
const getCurrentUserPins = ({ object, userName }) => _
  .chain(object.fields)
  .filter(
    (f) => ((!!(f.active_votes ?? []).find((v) => v.voter === userName && v.percent > 0)
        && f.name === FIELDS_NAMES.PIN)
      || (f.creator === userName && !f?.active_votes?.length && f.name === FIELDS_NAMES.PIN)
    ),
  )
  .map((el) => el.body)
  .value();

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
  getBlacklist,
  findFieldByBody,
  getPinFilter,
  getCurrentUserPins,
};
