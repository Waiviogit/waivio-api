const _ = require('lodash');
const { addDataToFields } = require('utilities/helpers/wObjectHelper');
const engineOperations = require('utilities/hiveEngine/engineOperations');
const { getWaivioAdminsAndOwner } = require('utilities/helpers/getWaivioAdminsAndOwnerHelper');
const { getBlacklist, getWobjectFields, calculateApprovePercent } = require('utilities/helpers/wObjectHelper');
const ObjectTypeModel = require('models/ObjectTypeModel');
const wObjectModel = require('models/wObjectModel');
const {
  FIELDS_NAMES, LIST_TYPES,
} = require('constants/wobjectsData');
const { postsUtil } = require('utilities/hiveApi');
const { ERROR_OBJ } = require('constants/common');

const getOneField = async ({
  authorPermlink, body, name, locale = 'en-US',
}) => {
  const { result } = await wObjectModel.findOne(
    {
      author_permlink: authorPermlink,
      fields: { $elemMatch: { body, name, locale } },
    },
    {
      'fields.$': 1,
    },
  );

  if (!result || !result?.fields?.length) return { error: ERROR_OBJ.NOT_FOUND };

  return { result: result.fields[0] };
};

const filterExposedFields = ({
  fields, exposedFields, type, locale,
}) => _.reduce(fields, (acc, el) => {
  if (!_.includes(exposedFields, el.name)) {
    return acc;
  }
  if (type && el.name !== type) {
    if (!_.includes(Object.values(LIST_TYPES), type)) return acc;
    if (type !== el.type) return acc;
  }

  if (locale && el.locale !== locale) return acc;
  el.approvePercent = calculateApprovePercent(el);
  if (_.has(el, '_id')) el.createdAt = el._id.getTimestamp().valueOf();

  acc.push(el);
  return acc;
}, []);

const fillUpdates = async ({
  limitedUpdates,
  wobject,
  app,
}) => {
  const waivioAdmins = await getWaivioAdminsAndOwner();

  const owner = _.get(app, 'owner');
  const admins = _.get(app, 'admins', []);
  const ownership = _.intersection(_.get(wobject, 'authority.ownership', []), _.get(app, 'authority', []));
  const administrative = _.intersection(_.get(wobject, 'authority.administrative', []), _.get(app, 'authority', []));
  const blacklist = await getBlacklist(_.uniq([owner, ...admins, ...waivioAdmins]));

  const filtered = addDataToFields({
    fields: limitedUpdates,
    admins,
    isOwnershipObj: !!ownership.length,
    ownership,
    administrative,
    owner,
    blacklist,
  });
  let comments = [];

  // try catch because noroutine module
  try {
    ({ comments } = await postsUtil.getCommentsArr(formatUpdatesForRequest(limitedUpdates)));
    await engineOperations.addWAIVToCommentsArray(comments);
  } catch (error) {}

  for (const update of filtered) {
    const comment = _.find(
      comments,
      (el) => el.author === update.author && el.permlink === update.permlink,
    );
    if (!comment) continue;
    comment.total_payout_value = comment?.total_payout_value?.amount || '0';
    Object.assign(
      update,
      _.pick(comment, ['children', 'total_pending_payout_value', 'total_payout_WAIV',
        'total_payout_value', 'pending_payout_value', 'curator_payout_value', 'cashout_time']),
    );
    update.fullBody = _.get(comment, 'body', '');
  }
  return filtered;
};

const formatUpdatesForRequest = (updates) => (
  _.map(updates, (update) => [update.author, update.permlink]));

const getFields = async ({
  authorPermlink, skip, limit, type, locale, sort, app,
}) => {
  const { wobject, error } = await getWobjectFields(authorPermlink);
  if (error) return { error };

  const { objectType } = await ObjectTypeModel.getOne({ name: wobject.object_type });
  const exposedFields = _.get(objectType, 'exposedFields', Object.values(FIELDS_NAMES));
  const updates = filterExposedFields({
    fields: wobject.fields,
    exposedFields,
    type,
    locale,
  });
  const limitedUpdates = _.chain(updates)
    .orderBy([sort], ['desc'])
    .slice(skip, skip + limit)
    .value();

  const fields = await fillUpdates({
    limitedUpdates,
    wobject,
    app,
  });

  return { fields, hasMore: updates.length > skip + limit };
};

module.exports = {
  getFields,
  getOneField,
};
