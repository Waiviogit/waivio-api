const _ = require('lodash');
const { wObjectHelper } = require('utilities/helpers');

module.exports = async ({ authorPermlink, fieldId, fieldName }) => {
  const { wobject } = await wObjectHelper.getWobjectFields(authorPermlink, fieldName);
};
