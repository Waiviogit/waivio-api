const _ = require('lodash');
const { getWobjectFields, calculateApprovePercent } = require('../../helpers/wObjectHelper');
const ObjectTypeModel = require('../../../models/ObjectTypeModel');
const { FIELDS_NAMES, LIST_TYPES } = require('../../../constants/wobjectsData');
const { postsUtil } = require('../../hiveApi');

exports.getFields = async ({
  authorPermlink, skip, limit, type, locale, sort,
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

  const fields = await fillUpdates(limitedUpdates);

  return { fields, hasMore: updates.length > skip + limit };
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

const fillUpdates = async (limitedUpdates) => {
  const { comments } = await postsUtil.getCommentsArr(formatUpdatesForRequest(limitedUpdates));
  for (const update of limitedUpdates) {
    const comment = _.find(
      comments,
      (el) => el.author === update.author && el.permlink === update.permlink,
    );
    Object.assign(update,
      _.pick(comment, ['children', 'total_pending_payout_value',
        'total_payout_value', 'pending_payout_value', 'curator_payout_value', 'cashout_time']));
    update.fullBody = _.get(comment, 'body', '');
  }
  return limitedUpdates;
};

const formatUpdatesForRequest = (updates) => (
  _.map(updates, (update) => [update.author, update.permlink]));
