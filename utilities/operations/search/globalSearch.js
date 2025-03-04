const _ = require('lodash');
const { searchObjectTypes } = require('./searchTypes');
const { searchUsers } = require('./searchUsers');
const { searchWobjects } = require('./searchWobjects');
const { getSessionApp } = require('../../helpers/sitesHelper');

exports.getGlobalSearch = async ({
  searchString, userLimit, wobjectsLimit, objectsTypeLimit, sortByApp, onlyObjectTypes,
}) => {
  const { result: app } = await getSessionApp();

  const { objectTypes, objectTypesCount } = await searchObjectTypes(
    { string: searchString, limit: objectsTypeLimit, supportedTypes: _.get(app, 'supported_object_types', []) },
  );
  const { wobjects, wobjectsCounts } = await searchWobjects({
    string: searchString, limit: wobjectsLimit, sortByApp, needCounters: true, app, onlyObjectTypes,
  });
  const { users, usersCount } = await searchUsers({ string: searchString, limit: userLimit });

  return {
    objectTypes, objectTypesCount, wobjects, wobjectsCounts, users, usersCount,
  };
};
