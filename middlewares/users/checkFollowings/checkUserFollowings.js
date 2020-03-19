const _ = require('lodash');
const { User } = require('models');
const { schema } = require('middlewares/users/checkFollowers/schema');

exports.check = async (req, res, next) => {
  const currentSchema = schema.find((s) => s.path === req.route.path && s.method === req.method);

  if (!currentSchema || !req.headers.follower) {
    return next();
  }

  switch (currentSchema.case) {
    case 1:
      break;
    case 2:
      break;
  }
  next();
};
