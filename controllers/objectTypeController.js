const { searchObjectTypes } = require('utilities/operations/search/searchTypes');
const { getAll, getOne, getExperts } = require('utilities/operations/objectType');
const validators = require('controllers/validators');

const index = async (req, res, next) => {
  const value = validators.validate({
    limit: req.body.limit,
    skip: req.body.skip,
    wobjects_count: req.body.wobjects_count,
  }, validators.objectType.indexSchema, next);

  if (!value) return;
  const { objectTypes, error } = await getAll(value);

  if (error) return next(error);
  res.result = { status: 200, json: objectTypes };
  next();
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
  }, validators.objectType.showSchema, next);

  if (!value) return;
  const { objectType, error } = await getOne(value);

  if (error) {
    return next(error);
  }
  res.result = { status: 200, json: objectType };
  next();
};

const search = async (req, res, next) => {
  const { objectTypes, error } = await searchObjectTypes({
    string: req.body.search_string,
    skip: req.body.skip || 0,
    limit: req.body.limit || 30,
  });

  if (error) {
    return next(error);
  }
  res.result = { status: 200, json: objectTypes };
  next();
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
  res.result = { status: 200, json: users };
  next();
};


module.exports = {
  index, search, show, expertise,
};
