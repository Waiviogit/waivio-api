const _ = require('lodash');
const { wObjectHelper, appHelper } = require('utilities/helpers');
const { SPECIFIC_FIELDS_MAPPINGS, FIELDS_NAMES, FIELDS_TO_PARSE } = require('constants/wobjectsData');

module.exports = async ({
  authorPermlink, author, fieldName, locale, app, permlink,
}) => {
  const { wobject, error } = await wObjectHelper.getWobjectFields(authorPermlink, fieldName);
  const { error: appError, result: appData } = await appHelper.getApp();
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
  const toDisplay = filteredObject[
    fieldName === FIELDS_NAMES.CATEGORY_ITEM
      ? FIELDS_NAMES.TAG_CATEGORY
      : fieldName
  ];

  return {
    toDisplay: _.includes(FIELDS_TO_PARSE, fieldName) ? parseJson(toDisplay) : toDisplay,
    field: _.find(filteredObject.fields, (field) => field.author === author && field.permlink === permlink),
  };
};

const parseJson = (data) => {
  try {
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
};
