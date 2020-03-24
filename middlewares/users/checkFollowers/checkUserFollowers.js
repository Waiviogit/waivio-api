const _ = require('lodash');
const { User } = require('models');
const { schema } = require('middlewares/users/checkFollowers/schema');

exports.check = async (req, res, next) => {
  const currentSchema = schema.find((s) => s.path === req.route.path && s.method === req.method);

  if (!currentSchema || !req.headers.following) {
    return next();
  }

  switch (currentSchema.case) {
    case 1:
      const { followers, error: usersError } = await checkForFollowers(
        {
          userName: req.headers.following,
          followers: res.result.json,
          path: currentSchema.field_name,
        },
      );
      if (usersError) return next(usersError);
      res.result.json = followers;
      break;
    case 2:
      const { followers: searchUsers, error } = await checkForFollowers(
        {
          userName: req.headers.following,
          followers: res.result.json[currentSchema.fields_path],
          path: currentSchema.field_name,
        },
      );
      if (error) return next(error);
      res.result.json[currentSchema.fields_path] = searchUsers;
      break;
    case 3:
      const { follower, error: e } = await checkForFollowersSingle(
        {
          userName: req.headers.following,
          follower: res.result.json,
          path: currentSchema.field_name,
        },
      );
      if (e) return next(e);
      res.result.json = follower;
      break;
  }
  next();
};

const checkForFollowers = async ({ userName, followers, path }) => {
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


const checkForFollowersSingle = async ({ userName, follower, path }) => {
  const { usersData, error } = await User.find(
    { condition: { name: follower.name, users_follow: userName } },
  );
  if (error) return { error };

  follower.followsYou = !!_.find(usersData, (user) => follower[path] === user.name);
  return { follower };
};
