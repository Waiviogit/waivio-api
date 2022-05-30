const {
  REQUIREDFIELDS_PARENT, MIN_PERCENT_TO_SHOW_UPGATE, VOTE_STATUSES, OBJECT_TYPES,
  ADMIN_ROLES, categorySwitcher, FIELDS_NAMES, ARRAY_FIELDS, INDEPENDENT_FIELDS,
} = require('constants/wobjectsData');
const { postsUtil } = require('utilities/hiveApi');
const ObjectTypeModel = require('models/ObjectTypeModel');
const blacklistModel = require('models/blacklistModel');
const UserWobjects = require('models/UserWobjects');
const { DEVICE } = require('constants/common');
const { getNamespace } = require('cls-hooked');
const Wobj = require('models/wObjectModel');
const mutedModel = require('models/mutedUserModel');
const moment = require('moment');
const _ = require('lodash');
const { getWaivioAdminsAndOwner } = require('./getWaivioAdminsAndOwnerHelper');

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
        if (_.includes(filter, FIELDS_NAMES.GALLERY_ALBUM)) break;
        if (_.get(field, 'adminVote.status') === VOTE_STATUSES.APPROVED) validFields.push(field);
        else if (field.weight > 0 && field.approvePercent > MIN_PERCENT_TO_SHOW_UPGATE) {
          validFields.push(field);
        }
        break;
      default:
        break;
    }
  }
  const condition = id === FIELDS_NAMES.GALLERY_ITEM
      && _.includes(filter, FIELDS_NAMES.GALLERY_ALBUM)
      && idFields.length && !allFields[FIELDS_NAMES.GALLERY_ALBUM];

  if (id === FIELDS_NAMES.GALLERY_ALBUM || condition) {
    const noAlbumItems = _.filter(allFields[categorySwitcher[id]],
      (item) => item.id === permlink && _.get(item, 'adminVote.status') !== VOTE_STATUSES.REJECTED);
    if (noAlbumItems.length)validFields.push({ items: noAlbumItems, body: 'Photos', id: permlink });
    id = FIELDS_NAMES.GALLERY_ALBUM;
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
  const fieldTypes = _.reduce(fields, (acc, el) => {
    if (_.has(acc, `${el.name}`)) {
      acc[el.name].push(el);
      return acc;
    }
    acc[el.name] = [el];
    return acc;
  }, {});

  return _.reduce(fieldTypes, (acc, el) => {
    const nativeLang = _
      .filter(el, (field) => filterFieldValidation(filter, field, locale, ownership));

    _.isEmpty(nativeLang) && locale !== 'en-US'
      ? acc = [...acc, ..._.filter(el, (field) => filterFieldValidation(filter, field, 'en-US', ownership))]
      : acc = [...acc, ...nativeLang];
    return acc;
  }, []);
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
      if (result.length)winningFields[newId] = result;
      continue;
    }

    if (approvedFields.length) {
      const ownerVotes = _.filter(approvedFields,
        (field) => field.adminVote.role === ADMIN_ROLES.OWNER);
      const adminVotes = _.filter(approvedFields,
        (field) => field.adminVote.role === ADMIN_ROLES.ADMIN);
      if (ownerVotes.length) winningFields[id] = _.maxBy(ownerVotes, 'adminVote.timestamp').body;
      else if (adminVotes.length) winningFields[id] = _.maxBy(adminVotes, 'adminVote.timestamp').body;
      else winningFields[id] = _.maxBy(approvedFields, 'adminVote.timestamp').body;
      continue;
    }
    const heaviestField = _.maxBy(groupedFields[id], (field) => {
      if (_.get(field, 'adminVote.status') !== 'rejected' && field.weight > 0
          && field.approvePercent > MIN_PERCENT_TO_SHOW_UPGATE) return field.weight;
    });
    if (heaviestField) winningFields[id] = heaviestField.body;
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

/** Parse wobjects to get its winning */
const processWobjects = async ({
  wobjects, fields, hiveData = false, locale = 'en-US',
  app, returnArray = true, topTagsLimit,
}) => {
  const filteredWobj = [];
  if (!_.isArray(wobjects)) return filteredWobj;
  let parents = [];
  const parentPermlinks = _.chain(wobjects).map('parent').compact().uniq()
    .value();
  if (parentPermlinks.length) {
    ({ result: parents } = await Wobj.find({ author_permlink: { $in: parentPermlinks } }));
  }
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
      exposedFields = _.get(objectType, 'exposedFields', Object.values(FIELDS_NAMES));
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
    }
    if (obj.sortCustom) obj.sortCustom = JSON.parse(obj.sortCustom);
    if (obj.newsFilter) {
      obj.newsFilter = _.map(obj.newsFilter, (item) => _.pick(item, ['title', 'permlink', 'name']));
    }
    if (_.isString(obj.parent)) {
      const parent = _.find(parents, { author_permlink: obj.parent });
      obj.parent = await getParentInfo({ locale, app, parent });
    }
    obj.defaultShowLink = getLinkToPageLoad(obj);
    obj.exposedFields = exposedFields;
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

module.exports = {
  getUserSharesInWobj,
  getLinkToPageLoad,
  getWobjectFields,
  getCurrentNames,
  processWobjects,
  getParentInfo,
  fillObjectByExposedFields,
  calculateApprovePercent,
};
