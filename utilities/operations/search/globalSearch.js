const _ = require('lodash');
const { searchObjectTypes } = require('utilities/operations/search/searchTypes');
const { searchUsers } = require('utilities/operations/search/searchUsers');
const { searchWobjects } = require('utilities/operations/search/searchWobjects');
const { getSessionApp } = require('utilities/helpers/sitesHelper');

exports.getGlobalSearch = async ({
  searchString, userLimit, wobjectsLimit, objectsTypeLimit, sortByApp,
}) => {
  const { result: app } = await getSessionApp();
  const escapedReservedCharacters = searchString.replace(/[.?+*|{}[\]()"\\@]/g, '\\\\$&');

  const { objectTypes, objectTypesCount } = await searchObjectTypes(
    { string: escapedReservedCharacters, limit: objectsTypeLimit, supportedTypes: _.get(app, 'supported_object_types', []) },
  );
  const { wobjects, wobjectsCounts } = await searchWobjects({
    string: escapedReservedCharacters, limit: wobjectsLimit, sortByApp, needCounters: true, app,
  });
  const { users, usersCount } = await searchUsers({ string: escapedReservedCharacters, limit: userLimit });

  return {
    objectTypes, objectTypesCount, wobjects, wobjectsCounts, users, usersCount,
  };
};
