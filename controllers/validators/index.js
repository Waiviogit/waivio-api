exports.wobject = require('./wobjectValidator');
exports.user = require('./userValidator');
exports.sites = require('./sitesValidator');
exports.post = require('./postValidator');
exports.generalSearch = require('./generalSearch');
exports.objectType = require('./objectTypeValidator');
exports.app = require('./appValidator');
exports.apiKeyValidator = require('./apiKeyValidator');
exports.vipTickets = require('./vipTicketsValidator');
exports.hive = require('./hiveValidator');
exports.departments = require('./departments');
exports.shop = require('./shop');
exports.draft = require('./draft');
exports.threads = require('./threadsValidator');

exports.validate = (data, schema, next) => {
  const result = schema.validate(data, { abortEarly: false });

  if (result.error) {
    const error = { status: 422, message: result.error.message };
    return next(error);
  }
  return result.value;
};
