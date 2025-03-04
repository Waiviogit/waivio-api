const _ = require('lodash');
const { App } = require('../../../models');
const sitesHelper = require('../../helpers/sitesHelper');

exports.getObjectsFilter = async ({ host, userName }) => {
  const { result, error } = await App.findOne({ host, owner: userName, inherited: true });
  if (error) return { error };
  if (!result) return { error: { status: 404, message: 'App not found' } };

  return { result: _.get(result, 'object_filters', {}) };
};

exports.saveObjectsFilter = async (params) => {
  const { result, error } = await App.findOne(
    { host: params.host, owner: params.userName, inherited: true },
  );
  if (error) return { error };
  if (!result) return { error: { status: 404, message: 'App not found' } };

  const errorData = { status: 422, message: 'Object filters validation failed, not all keys exist' };
  const objectsFilterKeys = Object.keys(result.object_filters);
  if (!_.isEqual(objectsFilterKeys.sort(), Object.keys(params.objectsFilter).sort())) {
    return { error: errorData };
  }
  for (const type of objectsFilterKeys) {
    if (!_.isEqual(Object.keys(result.object_filters[type]).sort(), Object.keys(params.objectsFilter[type]).sort())) {
      return { error: errorData };
    }
  }
  const { result: updatedApp, error: updateError } = await App.findOneAndUpdate(
    { _id: result._id }, { object_filters: filtersToLowerCase(params.objectsFilter) },
  );
  if (updateError) return { error: updateError };
  await sitesHelper.updateSupportedObjects({ host: result.host, app: updatedApp });
  return { result: updatedApp.object_filters };
};

const filtersToLowerCase = (filters) => _.reduce(filters, (acc, objectType, objectTypeIndex) => {
  acc[objectTypeIndex] = _.reduce(objectType, (acc2, category, categoryIndex) => {
    acc2[categoryIndex] = _.map(category, (value) => value.toLocaleLowerCase());
    return acc2;
  }, {});
  return acc;
}, {});
