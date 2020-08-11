const _ = require('lodash');
const UserWobjects = require('models/UserWobjects');
const Wobj = require('models/wObjectModel');
const { postsUtil } = require('utilities/steemApi');
const { categorySwitcher } = require('utilities/constants');
const { REQUIREDFIELDS_PARENT, MIN_PERCENT_TO_SHOW_UPGATE } = require('utilities/constants');

// eslint-disable-next-line camelcase
const getUserSharesInWobj = async (name, author_permlink) => {
  const userObjectShare = await UserWobjects.findOne({ user_name: name, author_permlink }, '-_id weight');

  return _.get(userObjectShare, 'weight') || 0;
};

const getWobjectFields = async (permlink, name) => {
  const { result } = await Wobj.findOne(permlink);
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

const addDataToFields = (fields, admins, filter) => {
  if (filter) fields = _.filter(fields, (field) => _.includes(filter, field.name));
  for (const field of fields) {
    const adminVotes = [];
    _.map(field.active_votes, (vote) => {
      if (_.includes(admins, vote.voter)) {
        adminVotes.push(vote);
        vote.admin = true;
        vote.timestamp = vote._id.getTimestamp().valueOf();
      }
    });
    if (adminVotes.length) {
      const lastVote = _.maxBy(adminVotes, 'timestamp');
      field.adminVote = {
        role: 'admin',
        status: lastVote.percent > 0 ? 'approved' : 'rejected',
        name: lastVote.voter,
        timestamp: lastVote.timestamp,
      };
    }
    field.approvePercent = calculateApprovePercent(field);
    field.createdAt = field._id.getTimestamp().valueOf();
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

const filterFieldValidation = (filter, field, locale) => {
  const localeIndependentFields = ['status', 'map', 'parent'];
  let result = _.includes(localeIndependentFields, field.name) || locale === field.locale;
  if (filter) result = result && _.includes(filter, field.name);
  return result;
};

const getFieldsToDisplay = (fields, locale, filter, permlink) => {
  const arrayFields = ['categoryItem', 'listItem', 'tagCategory', 'galleryAlbum', 'galleryItem', 'rating', 'button', 'phone'];
  const winningFields = {};
  const filteredFields = _.filter(fields,
    (field) => filterFieldValidation(filter, field, locale));
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
      winningFields[id] = _.maxBy(approvedFields, 'adminVote.timestamp').body;
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

const processWobjects = async ({
  wobjects, fields, hiveData = false, locale = 'en-US', admins = [], returnArray = true,
}) => {
  if (!_.isArray(wobjects)) return [];
  for (const obj of wobjects) {
    if (hiveData) {
      const { result } = await postsUtil.getPostState({ author: obj.author, permlink: obj.author_permlink, category: 'waivio-object' });
      if (!result) {
        obj.fields = [];
        continue;
      }
      obj.fields.map((field, index) => {
        const post = _.get(result, `content.${field.author}/${field.permlink}`);
        if (!post) delete obj.fields[index];
        Object.assign(field,
          _.pick(post, ['children', 'total_pending_payout_value', 'total_payout_value', 'pending_payout_value', 'curator_payout_value', 'cashout_time']));
        field.fullBody = post.body;
      });
    }
    obj.fields = addDataToFields(obj.fields, admins, fields);
    Object.assign(obj, getFieldsToDisplay(obj.fields, locale, fields, obj.author_permlink));
    // get right count of photos in object in request for only one object
    if (!fields) {
      obj.albums_count = _.get(obj, 'galleryAlbum', []).length;
      obj.photos_count = _.get(obj, 'galleryItem', []).length;
      obj.preview_gallery = _.orderBy(_.get(obj, 'galleryItem', []), ['weight'], ['asc']).slice(0, 3);

      obj.sortCustom = obj.sortCustom ? JSON.parse(obj.sortCustom) : [];
    }
    if (_.isString(obj.parent)) obj.parent = await getParentInfo(obj, locale, admins);
  }
  if (!returnArray) return wobjects[0];
  return wobjects;
};

const getParentInfo = async (wObject, locale, admins) => {
  if (wObject.parent) {
    // Temporary solution
    const { wObject: fullParent } = await Wobj.getOne(wObject.parent);
    wObject.parent = fullParent;

    wObject.parent = await processWobjects({
      locale, fields: REQUIREDFIELDS_PARENT, wobjects: [_.omit(wObject.parent, 'parent')], returnArray: false, admins,
    });
  } else wObject.parent = '';
  return wObject.parent;
};

module.exports = {
  getUserSharesInWobj,
  getWobjectFields,
  processWobjects,
  getParentInfo,
};
