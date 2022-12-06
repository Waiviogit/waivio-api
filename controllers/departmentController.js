const departments = require('utilities/operations/departments');
const validators = require('./validators');

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
  const value = validators
    .validate(req.body, validators.departments.departmentsWobjectsSchema, next);
  if (!value) return;
  const {
    wobjects,
    hasMore,
    error,
  } = await departments.getWobjectsByDepartments(value);

  if (error) return next(error);

  res.result = { status: 200, json: { wobjects, hasMore } };
  next();
};

module.exports = {
  getDepartments,
  getWobjectsByDepartments,
};
