const _ = require('lodash');
const { User } = require('models');
const { schema } = require('middlewares/users/moderation/schema');

exports.moderate = async (req, res, next) => {
  const currentSchema = schema.find((s) => s.path === req.route.path && s.method === req.method);

  if (!currentSchema || !req.headers.user) {
    return next();
  }

  switch (currentSchema.case) {
    case 1:
      const { followers, error: usersError } = await checkForFollowings(
        { userName: req.headers.user, followers: res.result.json, path: 'name' },
      );
      if (usersError) return next(usersError);
      res.result.json = followers;
      break;
    case 2:
      const { followers: searchUsers, error } = await checkForFollowings(
        { userName: req.headers.user, followers: res.result.json.users, path: 'account' },
      );
      if (error) return next(error);
      res.result.json.users = searchUsers;
  }
  next();
};

const checkForFollowings = async ({ userName, followers, path }) => {
  const names = _.map(followers, (follower) => follower[path]);
  const { usersData, error } = await User.find(
    { condition: { name: { $in: names }, users_follow: userName }, sort: { wobjects_weight: -1 } },
  );
  if (error) return { error };
  followers = _.forEach(followers, (follower) => {
    follower.followsYou = !!_.find(usersData, (user) => follower[path] === user.name);
  });
  return { followers };
};
