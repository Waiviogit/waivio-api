const _ = require('lodash');
const { schema } = require('middlewares/users/checkBellNotifications/schema');
const { Subscriptions, wobjectSubscriptions } = require('models');

exports.check = async (req, res, next) => {
  const currentSchema = schema.find((s) => s.path === _.get(req, 'route.path') && s.method === req.method);

  if (!currentSchema || !req.headers.follower) {
    return next();
  }

  switch (currentSchema.case) {
    case 1:
      await checkUserBell({
        result: res.result.json,
        follower: req.headers.follower,
        path: currentSchema.field_name,
      });
      break;
    case 2:
      await checkWobjectBell({
        result: res.result.json,
        follower: req.headers.follower,
        path: currentSchema.field_name,
      });
      break;
  }
  next();
};

const checkUserBell = async ({ result, follower, path }) => {
  const { subscription } = await Subscriptions.findOne({
    condition: {
      following: result[path],
      follower,
    },
  });
  result.bell = !!subscription?.bell;
};

const checkWobjectBell = async ({ result, follower, path }) => {
  const { subscription } = await wobjectSubscriptions.findOne({
    condition: {
      following: result[path],
      follower,
    },
  });
  result.bell = !!subscription?.bell;
};
