const _ = require('lodash');
const { wObjectHelper, jsonHelper } = require('../../helpers');
const { SPECIFIC_FIELDS_MAPPINGS, FIELDS_NAMES, FIELDS_TO_PARSE } = require('../../../constants/wobjectsData');
const { getPost } = require('../../hiveApi/postsUtil');
const { isMobileDevice } = require('../../../middlewares/context/contextHelper');

module.exports = async ({
  authorPermlink, author, fieldName, locale, permlink, reqUserName, app,
}) => {
  const { wobject, error } = await wObjectHelper.getWobjectFields(authorPermlink);
  if (error) return { error };

  const filteredObject = await wObjectHelper.processWobjects({
    wobjects: [wobject],
    fields: SPECIFIC_FIELDS_MAPPINGS[fieldName] || fieldName,
    locale,
    app,
    returnArray: false,
    hiveData: true,
    reqUserName,
    mobile: isMobileDevice(),
  });

  if (fieldName === 'avatar' && !filteredObject.avatar) {
    filteredObject.avatar = _.get(filteredObject, 'parent.avatar', '');
  }
  const toDisplay = filteredObject[
    fieldName === FIELDS_NAMES.CATEGORY_ITEM
      ? FIELDS_NAMES.TAG_CATEGORY
      : fieldName
  ];
  const field = _.find(filteredObject.fields, (el) => el.author === author && el.permlink === permlink);
  if (!field) return { error: { status: 404, message: 'Field not found' } };

  const { post, error: dbError } = await getPost({ author, permlink });
  if (dbError) return { error: dbError };

  Object.assign(
    field,
    _.pick(post, ['children', 'total_pending_payout_value', 'total_payout_value', 'pending_payout_value',
      'curator_payout_value', 'cashout_time']),
  );
  field.fullBody = post.body;

  return {
    toDisplay: _.includes(FIELDS_TO_PARSE, fieldName) ? jsonHelper.parseJson(toDisplay) : toDisplay,
    field,
  };
};
