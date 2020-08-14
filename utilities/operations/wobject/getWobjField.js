const _ = require('lodash');
const { wObjectHelper, appHelper } = require('utilities/helpers');
const { SPECIFIC_FIELDS_MAPPINGS } = require('utilities/constants');

module.exports = async ({
  authorPermlink, fieldId, fieldName, locale, app,
}) => {
  const { wobject, error } = await wObjectHelper.getWobjectFields(authorPermlink, fieldName);
  const { error: appError, app: appData } = await appHelper.getApp(app);
  if (error || appError) return { error: error || appError };

  const filteredObject = await wObjectHelper.processWobjects({
    wobjects: [wobject],
    fields: SPECIFIC_FIELDS_MAPPINGS[fieldName] || fieldName,
    locale,
    app: appData,
    returnArray: false,
    hiveData: true,
  });

  if (fieldName === 'avatar' && !filteredObject.avatar) {
    filteredObject.avatar = _.get(filteredObject, 'parent.avatar', '');
  }

  return {
    toDisplay: filteredObject[fieldName === 'categoryItem' ? 'tagCategory' : fieldName],
    field: _.find(filteredObject.fields, (field) => field._id.toString() === fieldId),
  };
};
