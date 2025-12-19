const { searchObjectTypes } = require('../utilities/operations/search/searchTypes');
const {
  getAll,
  getOne,
  getExperts,
  showTags,
  getTagsForFilter,
  getCategoriesByObjectType,
  getCategoryTagsByObjectType,
} = require('../utilities/operations/objectType');
const validators = require('./validators');
const pipelineFunctions = require('../pipeline');
const RequestPipeline = require('../pipeline/requestPipeline');

const index = async (req, res, next) => {
  const value = validators.validate({
    limit: req.body.limit,
    skip: req.body.skip,
    wobjects_count: req.body.wobjects_count,
  }, validators.objectType.indexSchema, next);

  if (!value) return;
  const { objectTypes, error } = await getAll(value);

  if (error) return next(error);

  const pipeline = new RequestPipeline();
  const processedData = await pipeline
    .use(pipelineFunctions.moderateObjects)
    .execute(objectTypes, req);

  return res.status(200).json(processedData);
};

const show = async (req, res, next) => {
  const value = validators.validate({
    userName: req.body.userName,
    name: req.params.objectTypeName,
    wobjLimit: req.body.wobjects_count,
    wobjSkip: req.body.wobjects_skip,
    filter: req.body.filter,
    sort: req.body.sort,
    simplified: req.body.simplified,
    appName: req.headers.app,
  }, validators.objectType.showSchema, next);

  if (!value) return;
  const { objectType, error } = await getOne({
    ...value,
    app: req.appData,
  });

  if (error) return next(error);

  const pipeline = new RequestPipeline();
  const processedData = await pipeline
    .use(pipelineFunctions.moderateObjects)
    .execute(objectType, req);

  return res.status(200).json(processedData);
};

const search = async (req, res, next) => {
  const { objectTypes, error } = await searchObjectTypes({
    string: req.body.search_string.toLocaleLowerCase(),
    skip: req.body.skip || 0,
    limit: req.body.limit || 30,
  });
  if (error) return next(error);

  return res.status(200).json(objectTypes);
};

const expertise = async (req, res, next) => {
  const value = validators.validate({
    name: req.params.objectTypeName,
    limit: req.query.limit,
    skip: req.query.skip,
  }, validators.objectType.expertsSchema, next);

  if (!value) return;
  const { users, error } = await getExperts(value);
  if (error) return next(error);

  return res.status(200).json(users);
};
const showMoreTags = async (req, res, next) => {
  const value = validators.validate(
    req.query,
    validators.objectType.showMoreTagsSchema,
    next,
  );
  if (!value) return;
  const { tags, hasMore, error } = await showTags(value);
  if (error) return next(error);

  return res.status(200).json({ tagCategory: value.tagCategory, tags, hasMore });
};

const tagsForFilter = async (req, res, next) => {
  const value = validators.validate(
    req.body,
    validators.objectType.tagsForFilterSchema,
    next,
  );
  if (!value) return;
  const { tags, error } = await getTagsForFilter({ ...value, app: req.appData });
  if (error) return next(error);

  return res.status(200).json(tags);
};

const tagCategories = async (req, res, next) => {
  const value = validators.validate({
    objectType: req.params.objectTypeName,
    ...req.body,
  }, validators.objectType.tagCategoriesSchema, next);
  if (!value) return;
  try {
    const { result: categories, error } = await getCategoriesByObjectType({
      objectType: value.objectType,
      tagsLimit: value.tagsLimit,
      searchString: value.searchString,
      tagCategory: value.tagCategory,
      app: req.appData,
    });
    if (error) return next(error);

    return res.status(200).json(categories);
  } catch (error) {
    return next(error);
  }
};

const tagCategoryDetails = async (req, res, next) => {
  let selectedTags = [];
  if (req.query.selectedTags) {
    selectedTags = Array.isArray(req.query.selectedTags)
      ? req.query.selectedTags
      : [req.query.selectedTags];
  }

  const value = validators.validate({
    objectType: req.params.objectTypeName,
    tagCategory: req.params.tagCategory,
    skip: req.query.skip,
    limit: req.query.limit,
    searchString: req.query.searchString,
    selectedTags,
  }, validators.objectType.categoryTagsSchema, next);
  if (!value) return;
  try {
    const { result, error } = await getCategoryTagsByObjectType({
      objectType: value.objectType,
      tagCategory: value.tagCategory,
      skip: value.skip,
      limit: value.limit,
      searchString: value.searchString,
      selectedTags: value.selectedTags,
      app: req.appData,
    });
    if (error) return next(error);

    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  index,
  search,
  show,
  expertise,
  showMoreTags,
  tagsForFilter,
  tagCategories,
  tagCategoryDetails,
};
