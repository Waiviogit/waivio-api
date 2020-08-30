const _ = require('lodash');
const { Subscriptions } = require('models');
const { schema } = require('middlewares/users/checkFollowers/schema');

exports.check = async (req, res, next) => {
  const currentSchema = schema.find((s) => s.path === _.get(req, 'route.path') && s.method === req.method);

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

  const { subscriptionData } = await Subscriptions
    .find({ condition: { follower: { $in: names }, following: userName } });

  followers = _.forEach(followers, (follower) => {
    follower.followsYou = !!_.find(subscriptionData, (el) => el.follower === follower.name);
  });
  return { followers };
};

const checkForFollowersSingle = async ({ userName, follower, path }) => {
  const { subscription, error } = await Subscriptions
    .findOne({ condition: { follower: follower[path], following: userName } });
  if (error) return { error };

  follower.followsYou = !!subscription;
  return { follower };
};
