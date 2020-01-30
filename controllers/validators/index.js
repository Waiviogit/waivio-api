const moduleExports = {};
const Joi = require('joi');

moduleExports.wobject = require('./wobjectValidator');
moduleExports.user = require('./userValidator');
moduleExports.post = require('./postValidator');
moduleExports.generalSearch = require('./generalSearch');
moduleExports.objectType = require('./objectTypeValidator');
moduleExports.app = require('./appValidator');

moduleExports.validate = (data, schema, next) => {
  const result = Joi.validate(data, schema);

  if (result.error) {
    const error = { status: 422, message: result.error.message };

    // return { error };
    return next(error);
  }
  return result.value;
};


module.exports = moduleExports;
