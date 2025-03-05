const { ObjectType } = require('../../../models');
const { getSessionApp } = require('../../helpers/sitesHelper');

const makeCountPipeline = (string, supportedTypes) => {
  const condition = { $and: [{ name: { $regex: `${string}`, $options: 'i' } }] };
  if (supportedTypes.length)condition.$and.push({ name: { $in: supportedTypes } });
  return [{ $match: condition }, { $count: 'count' }];
};

exports.searchObjectTypes = async ({
  string, limit, skip, supportedTypes,
}) => {
  /** Get supported object types from app */
  if (!supportedTypes) {
    const { result: app, error } = await getSessionApp();
    if (!app || error) supportedTypes = [];
    else supportedTypes = app.supported_object_types;
  }

  const { objectTypes = [] } = await ObjectType.search({
    string, limit, skip, supportedTypes,
  });
  const {
    result: [
      { count: objectTypesCount = 0 } = {}] = [],
  } = await ObjectType.aggregate(makeCountPipeline(string, supportedTypes));

  return { objectTypes, objectTypesCount };
};
