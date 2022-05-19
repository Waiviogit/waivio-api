const _ = require('lodash');
const { getWobjectFields, fillObjectByExposedFields } = require('../../helpers/wObjectHelper');
const ObjectTypeModel = require('../../../models/ObjectTypeModel');
const { FIELDS_NAMES } = require('../../../constants/wobjectsData');

exports.getFields = async ({ authorPermlink }) => {
  const { wobject, error } = await getWobjectFields(authorPermlink);
  if (error) return { error };

  const { objectType } = await ObjectTypeModel.getOne({ name: wobject.object_type });
  const exposedFields = _.get(objectType, 'exposedFields', Object.values(FIELDS_NAMES));
  const objectWithFields = await fillObjectByExposedFields(wobject, exposedFields);

  return { fields: objectWithFields.fields };
};
