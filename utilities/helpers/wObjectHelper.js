const _ = require('lodash');
const UserWobjects = require('models/UserWobjects');
const Wobj = require('models/wObjectModel');
const { postsUtil } = require('utilities/steemApi');
const {
  REQUIREDFIELDS_PARENT, MIN_PERCENT_TO_SHOW_UPGATE, ADMIN_ROLES, categorySwitcher,
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
  if (field.weight < 0) return 0;
  if (_.isEmpty(field.active_votes)) return 100;
  if (field.adminVote) return field.adminVote.status === 'approved' ? 100 : 0;

  const rejectsWeight = _.sumBy(field.active_votes, (vote) => {
    if (vote.percent < 0) return -(+vote.weight);
  }) || 0;
  if (!rejectsWeight) return 100;
  const approvesWeight = _.sumBy(field.active_votes, (vote) => {
    if (vote.percent > 0) return +vote.weight;
  }) || 0;
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

const addDataToFields = (fields, filter, admins, ownership, administrative) => {
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
      } else if (_.includes(ownership, vote.voter)) {
        vote.ownership = true;
        vote.timestamp > _.get(ownershipVote, 'timestamp', 0) ? ownershipVote = vote : null;
      }
    });
    field.approvePercent = calculateApprovePercent(field);
    field.createdAt = field._id.getTimestamp().valueOf();
    /** If field includes admin votes fill in it */
    if (adminVote || administrativeVote || ownershipVote) {
      const mainVote = adminVote || ownershipVote || administrativeVote;
      field.adminVote = {
        role: getFieldVoteRole(mainVote),
        status: mainVote.percent > 0 ? 'approved' : 'rejected',
        name: mainVote.voter,
        timestamp: mainVote.timestamp,
      };
    }
  }
  return fields;
};

const specialFieldFilter = (idField, allFields, id) => {
  if (!idField.adminVote && idField.weight < 0) return null;
  idField.items = [];
  const filteredItems = _.filter(allFields[categorySwitcher[id]],
    (item) => item.id === idField.id && _.get(item, 'adminVote.status') !== 'rejected');

  for (const itemField of filteredItems) {
    if (!idField.adminVote && itemField.weight < 0) continue;
    idField.items.push(itemField);
  }
  if (id === 'tagCategory' && idField.items.length === 0) return null;
  return idField;
};

const arrayFieldFilter = ({
  idFields, allFields, filter, id, permlink,
}) => {
  const validFields = [];
  for (const field of idFields) {
    if (_.get(field, 'adminVote.status') === 'rejected') continue;
    switch (id) {
      case 'tagCategory':
      case 'galleryAlbum':
        validFields.push(specialFieldFilter(field, allFields, id));
        break;
      case 'rating':
      case 'phone':
      case 'button':
      case 'galleryItem':
      case 'listItem':
        if (_.includes(filter, 'galleryAlbum')) break;
        if (_.get(field, 'adminVote.status') === 'approved') validFields.push(field);
        else if (field.weight > 0) validFields.push(field);
        break;
      default:
        break;
    }
  }
  if (id === 'galleryAlbum') {
    const noAlbumItems = _.filter(allFields[categorySwitcher[id]],
      (item) => item.id === permlink && _.get(item, 'adminVote.status') !== 'rejected');
    if (noAlbumItems.length)validFields.push({ items: noAlbumItems, body: 'Photos' });
  }
  return _.compact(validFields);
};

const filterFieldValidation = (filter, field, locale, ownership) => {
  field.locale === 'auto' ? field.locale = 'en-US' : null;
  const localeIndependentFields = ['status', 'map', 'parent'];
  let result = _.includes(localeIndependentFields, field.name) || locale === field.locale;
  if (filter) result = result && _.includes(filter, field.name);
  if (ownership) {
    result = result && _.includes(
      [ADMIN_ROLES.OWNERSHIP, ADMIN_ROLES.ADMIN], _.get(field, 'adminVote.role'),
    );
  }
  return result;
};

const getFieldsToDisplay = (fields, locale, filter, permlink, ownership) => {
  const arrayFields = ['categoryItem', 'listItem', 'tagCategory', 'galleryAlbum', 'galleryItem', 'rating', 'button', 'phone'];
  const winningFields = {};
  const filteredFields = _.filter(fields,
    (field) => filterFieldValidation(filter, field, locale, ownership));
  if (!filteredFields.length) return {};

  const groupedFields = _.groupBy(filteredFields, 'name');
  for (const id of Object.keys(groupedFields)) {
    const approvedFields = _.filter(groupedFields[id],
      (field) => _.get(field, 'adminVote.status') === 'approved');

    if (_.includes(arrayFields, id)) {
      const result = arrayFieldFilter({
        idFields: groupedFields[id], allFields: groupedFields, filter, id, permlink,
      });
      if (result.length)winningFields[id] = result;
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
    // Temporary solution
    const { wObject: fullParent } = await Wobj.getOne(wObject.parent);
    wObject.parent = fullParent;

    wObject.parent = await processWobjects({
      locale, fields: REQUIREDFIELDS_PARENT, wobjects: [_.omit(wObject.parent, 'parent')], returnArray: false, app,
    });
  } else wObject.parent = '';
  return wObject.parent;
};

/** Parse wobjects to get its winning */
const processWobjects = async ({
  wobjects, fields, hiveData = false, locale = 'en-US',
  app, returnArray = true,
}) => {
  const filteredWobj = [];
  if (!_.isArray(wobjects)) return filteredWobj;
  for (let obj of wobjects) {
    /** Get app admins, wobj administrators, which was approved by app owner(creator) */
    const admins = _.get(app, 'admins', []);
    const ownership = _.intersection(_.get(obj, 'authority.ownership', []), app.authority.ownership);
    const administrative = _.intersection(_.get(obj, 'authority.administrative', []), app.authority.administrative);

    /** If flag hiveData exists - fill in wobj fields with hive data */
    if (hiveData) {
      const { result } = await postsUtil.getPostState(
        { author: obj.author, permlink: obj.author_permlink, category: 'waivio-object' },
      );
      if (!result) {
        obj.fields = [];
        continue;
      }
      obj.fields.map((field, index) => {
        const post = _.get(result, `content.${field.author}/${field.permlink}`);
        if (!post) delete obj.fields[index];
        Object.assign(field,
          _.pick(post, ['children', 'total_pending_payout_value',
            'total_payout_value', 'pending_payout_value', 'curator_payout_value', 'cashout_time']));
        field.fullBody = post.body;
      });
    }
    obj.fields = addDataToFields(obj.fields, fields, admins, ownership, administrative);
    /** Omit map, because wobject has field map, temp solution? maybe field map in wobj not need */
    obj = _.omit(obj, ['map']);
    Object.assign(obj,
      getFieldsToDisplay(obj.fields, locale, fields, obj.author_permlink, !!ownership.length));
    /** Get right count of photos in object in request for only one object */
    if (!fields) {
      obj.albums_count = _.get(obj, 'galleryAlbum', []).length;
      obj.photos_count = _.get(obj, 'galleryItem', []).length;
      obj.preview_gallery = _.orderBy(
        _.get(obj, 'galleryItem', []), ['weight'], ['asc'],
      );
      obj.sortCustom = obj.sortCustom ? JSON.parse(obj.sortCustom) : [];
    }
    if (_.isString(obj.parent)) obj.parent = await getParentInfo(obj, locale, app);
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
