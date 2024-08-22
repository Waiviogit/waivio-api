const _ = require('lodash');
const { Subscriptions, wobjectSubscriptions } = require('models');
const { schema } = require('./schema');

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

const checkBellNotifications = async (data, req) => {
  const currentSchema = schema.find((s) => s.path === _.get(req, 'route.path') && s.method === req.method);

  if (!currentSchema || !req.headers.follower) {
    return data;
  }

  switch (currentSchema.case) {
    case 1:
      await checkUserBell({
        result: data,
        follower: req.headers.follower,
        path: currentSchema.field_name,
      });
      break;
    case 2:
      await checkWobjectBell({
        result: data,
        follower: req.headers.follower,
        path: currentSchema.field_name,
      });
      break;
  }
  return data;
};

module.exports = checkBellNotifications;
