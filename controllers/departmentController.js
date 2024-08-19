const departments = require('utilities/operations/departments');
const validators = require('./validators');
const pipelineFunctions = require('../pipeline');
const RequestPipeline = require('../pipeline/requestPipeline');

const getDepartments = async (req, res, next) => {
  const value = validators.validate(req.body, validators.departments.departmentsSchema, next);
  if (!value) return;
  const {
    result,
    error,
  } = await departments.getDepartments(value);
  if (error) return next(error);
  res.json(result);
};

const getWobjectsByDepartments = async (req, res, next) => {
  const value = validators.validate(
    { ...req.body, userName: req.headers.follower },
    validators.departments.departmentsWobjectsSchema,
    next,
  );
  if (!value) return;
  const {
    wobjects,
    hasMore,
    error,
  } = await departments.getWobjectsByDepartments(value);

  if (error) return next(error);

  const pipeline = new RequestPipeline();
  const processedData = await pipeline
    .use(pipelineFunctions.moderateObjects)
    .execute({ wobjects, hasMore }, req);

  return res.status(200).json(processedData);
};

const getDepartmentsSearch = async (req, res, next) => {
  const value = validators
    .validate(req.body, validators.departments.departmentsSearchSchema, next);
  if (!value) return;
  const {
    result,
    hasMore,
    error,
  } = await departments.searchDepartments(value);

  if (error) return next(error);

  res.result = { status: 200, json: { result, hasMore } };
  next();
};

module.exports = {
  getDepartments,
  getWobjectsByDepartments,
  getDepartmentsSearch,
};
