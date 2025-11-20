const moduleExports = {};

moduleExports.updateTopWobjects = require('./updateTopWobjects');
moduleExports.getAll = require('./getAllObjectTypes');
moduleExports.getOne = require('./getOneObjectType');
moduleExports.updateTopExperts = require('./updateTopExperts');
moduleExports.getExperts = require('./getExperts');
moduleExports.showTags = require('./showTags');
moduleExports.getTagsForFilter = require('./getTagsForFilter');
const {
  getCategoriesByObjectType,
  getCategoryTagsByObjectType,
} = require('./tagsForFilter');

moduleExports.getCategoriesByObjectType = getCategoriesByObjectType;
moduleExports.getCategoryTagsByObjectType = getCategoryTagsByObjectType;

module.exports = moduleExports;
