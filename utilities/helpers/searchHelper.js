const _ = require('lodash');
const { OBJECT_TYPES } = require('../../constants/wobjectsData');
const { getSessionApp } = require('../helpers/sitesHelper');

exports.getAppInfo = async ({ app, addHashtag }) => {
  if (!app) ({ result: app } = await getSessionApp());
  const supportedTypes = _.get(app, 'supported_object_types', []);
  if (addHashtag) supportedTypes.push(OBJECT_TYPES.HASHTAG);

  return {
    crucialWobjects: _.get(app, 'supported_objects', []),
    forExtended: _.get(app, 'canBeExtended'),
    forSites: _.get(app, 'inherited'),
    cities: _.get(app, 'configuration.availableCities'),
    prefetches: _.get(app, 'prefetches'),
    supportedTypes,
    app,
  };
};
