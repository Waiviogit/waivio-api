const _ = require('lodash');
const { getFollowingsArray } = require('utilities/operations/user/getFollowingsUser');
const { schema } = require('middlewares/users/moderation/schema');

exports.moderate = async (req, res, next) => {
  const currentSchema = schema.find((s) => s.path === req.route.path && s.method === req.method);

  if (!currentSchema) {
    return next();
  }

  switch (currentSchema.case) {
    case 1:
      if (!_.get(req, 'query.user')) return next();
      const { followers, error: usersError } = await checkForFollowings(
        { user: req.query.user, followers: res.result.json, path: 'name' },
      );
      if (usersError) return next(usersError);
      res.result.json = followers;
      break;
    case 2:
      if (!_.get(req, 'body.user')) return next();
      const { followers: searchUsers, error } = await checkForFollowings(
        { user: req.body.user, followers: res.result.json.users, path: 'account' },
      );
      if (error) return next(error);
      res.result.json.users = searchUsers;
  }
  next();
};

const checkForFollowings = async ({ user, followers, path }) => {
  const names = _.map(followers, (follower) => follower[path]);
  const { users, error } = await getFollowingsArray({ name: user, users: names });
  if (error) return { error };
  followers = _.forEach(followers, (follower) => {
    const status = _.find(users, (User) => follower[path] === Object.keys(User)[0]);
    follower.followsYou = status[follower[path]];
  });
  return { followers };
};
