const { schema } = require('middlewares/users/checkBellNotifications/schema');

exports.check = async (req, res, next) => {
  const currentSchema = schema.find((s) => s.path === req.route.path && s.method === req.method);

  if (!currentSchema || !req.headers.follower) {
    return next();
  }

  switch (currentSchema.case) {
    case 3:
      await checkBellNotificationSingle();
      break;
  }
};

const checkBellNotificationSingle = async () => {

};
