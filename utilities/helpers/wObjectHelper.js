const _ = require('lodash');
const { UserWobjects, Wobj } = require('models');
const { postsUtil } = require('utilities/steemApi');
const { categorySwitcher } = require('utilities/constants');

const formatRequireFields = (wObject, locale, requireFields) => {
  const temp = _.reduce(wObject.fields, (resArr, field) => {
    const currResField = resArr.find((item) => item.name === field.name);

    if (currResField && (!currResField.weight || currResField.weight < field.weight)) {
      resArr = resArr.map((item) => (item.name === field.name ? field : item));
    }
    return resArr;
  }, requireFields).filter((item) => !_.isNil(item.weight));

  wObject.fields = _.reduce(wObject.fields, (resArr, field) => {
    const currResField = resArr.find((item) => item.name === field.name);

    if (currResField) {
      if (currResField.locale !== locale && field.locale === locale) {
        resArr = resArr.map((item) => (item.name === field.name ? field : item));
      } else if (currResField.locale === locale
          && currResField.weight < field.weight && field.locale === locale) {
        resArr = resArr.map((item) => (item.name === field.name ? field : item));
      }
    }
    return resArr;
  }, temp);
};

// eslint-disable-next-line camelcase
const getUserSharesInWobj = async (name, author_permlink) => {
  const userObjectShare = await UserWobjects.findOne({ user_name: name, author_permlink }, '-_id weight');

  return _.get(userObjectShare, 'weight') || 0;
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
  const percent = _.round((approvesWeight / rejectsWeight) * 100, 3);
  return percent > 0 ? percent : 0;
};

const addDataToFields = (fields, admins) => {
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
  }
  return fields;
};

const specialFieldFilter = (idField, allFields, id) => {
  if (!idField.adminVote && idField.weight < 0) return null;
  idField.categoryItems = [];
  const filteredItems = _.filter(allFields[categorySwitcher[id]],
    (item) => _.get(item, 'adminVote.status') !== 'rejected');

  for (const itemField of filteredItems) {
    if (!idField.adminVote && idField.weight < 0) continue;
    idField.categoryItems.push(itemField);
  }
  return idField;
};

const arrayFieldFilter = (idFields, allFields, filter, id) => {
  const validFields = [];
  for (const field of idFields) {
    if (_.get(field, 'adminVote.status') === 'rejected') continue;
    switch (id) {
      case 'tagCategory':
      case 'galleryAlbum':
        validFields.push(specialFieldFilter(field, allFields, id));
        break;
      case 'listItem':
      case 'galleryItem':
        if (_.includes(filter, 'galleryAlbum')) break;
        if (_.get(field, 'adminVote.status') === 'approved') validFields.push(field);
        else if (field.weight > 0) validFields.push(field);
        break;
      default:
        break;
    }
  }
  return _.compact(validFields);
};

const filterFieldValidation = (fields, field, locale) => {
  const localeIndependentFields = ['status', 'map'];
  let result = _.includes(localeIndependentFields, field.name) || locale === field.locale;
  if (fields) result = result && _.includes(fields, field.name);
  return result;
};

const getFieldsToDisplay = (fields, locale, filter) => {
  const arrayFields = ['categoryItem', 'listItem', 'tagCategory', 'galleryAlbum', 'galleryItem'];
  const winningFields = {};
  const filteredFields = _.filter(fields,
    (field) => filterFieldValidation(filter, field, locale));
  if (!filteredFields.length) return {};

  const groupedFields = _.groupBy(filteredFields, 'name');
  for (const id of Object.keys(groupedFields)) {
    const approvedFields = _.filter(groupedFields[id], (field) => field.adminVote);

    if (_.includes(arrayFields, id)) {
      const result = arrayFieldFilter(groupedFields[id], groupedFields, filter, id);
      if (result.length)winningFields[id] = result;
      continue;
    }

    if (approvedFields.length) {
      const lastVotedField = _.maxBy(approvedFields, 'adminVote.timestamp');
      if (lastVotedField.status === 'approved') winningFields[id] = lastVotedField;
      continue;
    }
    const heaviestField = _.maxBy(groupedFields[id], 'weight');
    if (heaviestField.weight > 0) winningFields[id] = heaviestField;
  }
  return winningFields;
};

const processWobjects = async ({
  wobjects, fields, hiveData = false, locale = 'en-US', admins,
}) => {
  for (const obj of wobjects) {
    if (hiveData) {
      await Promise.all(obj.fields.map(async (field) => {
        const { result: post, error } = await postsUtil.getContent(
          { author: field.author, permlink: field.permlink },
        );
        if (error || !post.author) return;
        Object.assign(field,
          _.pick(post, ['children', 'total_pending_payout_value', 'total_payout_value', 'pending_payout_value', 'curator_payout_value']));
        field.fullBody = post.body;
      }));
    }
    obj.fields = addDataToFields(obj.fields, admins);
    obj.processFields = getFieldsToDisplay(obj.fields, locale, fields);
  }
  return wobjects;
};

// (async () => {
//   const { result } = await Wobj.findOne('pue-test8');
//   const wobg = await processWobjects({ wobjects: [result], admins: ['waivio_oleg-cigulyov'], hiveData: false });
//   console.log();
// })();

module.exports = { formatRequireFields, getUserSharesInWobj, processWobjects };
