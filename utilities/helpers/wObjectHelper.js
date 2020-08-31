const moment = require('moment');
const _ = require('lodash');
const UserWobjects = require('models/UserWobjects');
const Wobj = require('models/wObjectModel');
const ObjectTypeModel = require('models/ObjectTypeModel');
const { postsUtil } = require('utilities/steemApi');
const {
  REQUIREDFIELDS_PARENT, MIN_PERCENT_TO_SHOW_UPGATE, VOTE_STATUSES, OBJECT_TYPES,
  ADMIN_ROLES, categorySwitcher, FIELDS_NAMES, ARRAY_FIELDS, INDEPENDENT_FIELDS,
} = require('constants/wobjectsData');

// eslint-disable-next-line camelcase
const getUserSharesInWobj = async (name, author_permlink) => {
  const userObjectShare = await UserWobjects.findOne({ user_name: name, author_permlink }, '-_id weight');

  return _.get(userObjectShare, 'weight') || 0;
};

const getWobjectFields = async (permlink) => {
  const { result } = await Wobj.findOne(permlink);
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
  return role;
};

const addDataToFields = (fields, filter, admins, ownership, administrative, isOwnershipObj) => {
  /** Filter, if we need not all fields */
  if (filter) fields = _.filter(fields, (field) => _.includes(filter, field.name));

  for (const field of fields) {
    let adminVote, administrativeVote, ownershipVote;
    _.map(field.active_votes, (vote) => {
      vote.timestamp = vote._id.getTimestamp().valueOf();
      if (_.includes(admins, vote.voter)) {
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
    field.createdAt = field._id.getTimestamp().valueOf();
    /** If field includes admin votes fill in it */
    if (adminVote || administrativeVote || ownershipVote) {
      const mainVote = adminVote || ownershipVote || administrativeVote;
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
  if (id === FIELDS_NAMES.TAG_CATEGORY && idField.items.length === 0) return null;
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
      case FIELDS_NAMES.GALLERY_ITEM:
      case FIELDS_NAMES.LIST_ITEM:
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
      [ADMIN_ROLES.OWNERSHIP, ADMIN_ROLES.ADMIN], _.get(field, 'adminVote.role'),
    );
  }
  return result;
};

const getFieldsToDisplay = (fields, locale, filter, permlink, ownership) => {
  locale = locale === 'auto' ? 'en-US' : locale;
  const winningFields = {};
  const filteredFields = _.filter(fields,
    (field) => filterFieldValidation(filter, field, locale, ownership));
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
      const adminVotes = _.filter(approvedFields,
        (field) => field.adminVote.role === ADMIN_ROLES.ADMIN);
      if (adminVotes.length) winningFields[id] = _.maxBy(adminVotes, 'adminVote.timestamp').body;
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
const getParentInfo = async (wObject, locale, app) => {
  if (wObject.parent) {
    const { wObject: fullParent } = await Wobj.getOne(wObject.parent);
    if (!fullParent) {
      wObject.parent = '';
      return wObject.parent;
    }
    wObject.parent = fullParent;

    wObject.parent = await processWobjects({
      locale, fields: REQUIREDFIELDS_PARENT, wobjects: [_.omit(wObject.parent, 'parent')], returnArray: false, app,
    });
  } else wObject.parent = '';
  return wObject.parent;
};

const fillObjectByHiveData = async (obj, exposedFields) => {
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

    let post = _.get(result, `content.${field.author}/${field.permlink}`);
    if (!post || !post.author) post = createMockPost(field);

    Object.assign(field,
      _.pick(post, ['children', 'total_pending_payout_value',
        'total_payout_value', 'pending_payout_value', 'curator_payout_value', 'cashout_time']));
    field.fullBody = post.body;
  });
  return obj;
};

const getLinkToPageLoad = async (obj) => {
  switch (obj.object_type) {
    case OBJECT_TYPES.HASHTAG:
      break;
  }
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
  app, returnArray = true,
}) => {
  const filteredWobj = [];
  if (!_.isArray(wobjects)) return filteredWobj;
  for (let obj of wobjects) {
    let exposedFields = [];
    obj.parent = '';
    if (obj.newsFilter) obj = _.omit(obj, ['newsFilter']);
    /** Get app admins, wobj administrators, which was approved by app owner(creator) */
    const admins = _.get(app, 'admins', []);
    const isOwnershipObj = _.includes(_.get(app, 'ownership_objects', []), obj.author_permlink);
    const ownership = isOwnershipObj ? _.intersection(
      _.get(obj, 'authority.ownership', []), _.get(app, 'authority', []),
    ) : [];
    const administrative = _.intersection(
      _.get(obj, 'authority.administrative', []), _.get(app, 'authority', []),
    );

    /** If flag hiveData exists - fill in wobj fields with hive data */
    if (hiveData) {
      const { objectType } = await ObjectTypeModel.getOne({ name: obj.object_type });
      exposedFields = _.get(objectType, 'exposedFields', Object.values(FIELDS_NAMES));
      obj = await fillObjectByHiveData(obj, exposedFields);
    }

    obj.fields = addDataToFields(
      _.compact(obj.fields), fields, admins, ownership, administrative, isOwnershipObj,
    );
    /** Omit map, because wobject has field map, temp solution? maybe field map in wobj not need */
    obj = _.omit(obj, ['map']);
    Object.assign(obj,
      getFieldsToDisplay(obj.fields, locale, fields, obj.author_permlink, isOwnershipObj));
    /** Get right count of photos in object in request for only one object */
    if (!fields) {
      obj.albums_count = _.get(obj, FIELDS_NAMES.GALLERY_ALBUM, []).length;
      obj.photos_count = _.get(obj, FIELDS_NAMES.GALLERY_ITEM, []).length;
      obj.preview_gallery = _.orderBy(
        _.get(obj, FIELDS_NAMES.GALLERY_ITEM, []), ['weight'], ['desc'],
      );
      obj.sortCustom = obj.sortCustom ? JSON.parse(obj.sortCustom) : [];
      obj.defaultShowLink = getLinkToPageLoad(obj);
    }
    if (_.isString(obj.parent)) obj.parent = await getParentInfo(obj, locale, app);
    obj.exposedFields = exposedFields;
    if (!hiveData) obj = _.omit(obj, ['fields', 'latest_posts', 'last_posts_counts_by_hours', 'tagCategories', 'children']);
    filteredWobj.push(obj);
  }
  if (!returnArray) return filteredWobj[0];
  return filteredWobj;
};

module.exports = {
  getUserSharesInWobj,
  getWobjectFields,
  processWobjects,
  getParentInfo,
};
