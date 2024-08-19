const _ = require('lodash');
const { Subscriptions } = require('models');
const { schema } = require('./schema');

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

const checkFollowers = async (data, req) => {
  const currentSchema = schema.find((s) => s.path === _.get(req, 'route.path') && s.method === req.method);

  if (!currentSchema || !req.headers.following) {
    return data;
  }

  switch (currentSchema.case) {
    case 1:
      const { followers, error: usersError } = await checkForFollowers(
        {
          userName: req.headers.following,
          followers: data,
          path: currentSchema.field_name,
        },
      );
      if (usersError) return data;
      data = followers;
      break;
    case 2:
      const { followers: searchUsers, error } = await checkForFollowers(
        {
          userName: req.headers.following,
          followers: data[currentSchema.fields_path],
          path: currentSchema.field_name,
        },
      );
      if (error) return data;
      data[currentSchema.fields_path] = searchUsers;
      break;
    case 3:
      const { follower, error: e } = await checkForFollowersSingle(
        {
          userName: req.headers.following,
          follower: data,
          path: currentSchema.field_name,
        },
      );
      if (e) return data;
      data = follower;
      break;
  }
  return data;
};

module.exports = checkFollowers;
