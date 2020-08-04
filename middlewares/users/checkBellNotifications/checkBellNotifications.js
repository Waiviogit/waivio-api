const { schema } = require('middlewares/users/checkBellNotifications/schema');
const { BellNotifications } = require('models');

exports.check = async (req, res, next) => {
  const currentSchema = schema.find((s) => s.path === req.route.path && s.method === req.method);

  if (!currentSchema || !req.headers.follower) {
    return next();
  }

  switch (currentSchema.case) {
    case 3:
      await checkBellNotificationSingle({
        result: res.result.json,
        follower: req.headers.follower,
        path: currentSchema.field_name,
      });
      break;
  }
  next();
};

const checkBellNotificationSingle = async ({ result, follower, path }) => {
  const { bell } = await BellNotifications.findOne({
    following: result[path],
    follower,
  });
  result.bell = !!bell;
};
