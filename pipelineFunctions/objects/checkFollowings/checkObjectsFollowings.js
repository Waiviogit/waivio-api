const _ = require('lodash');
const { getFollowingsUser } = require('utilities/operations/user');
const { schema } = require('./schema');

exports.check = async (req, res, next) => {
  const currentSchema = schema.find((s) => s.path === _.get(req, 'route.path') && s.method === req.method);
  if (!currentSchema || !req.headers.follower) return next();

  switch (currentSchema.case) {
    case 1:
      const { followings, error: usersError } = await checkForFollowings({
        userName: req.headers.follower,
        followings: res.result.json,
        path: currentSchema.field_name,
      });
      if (usersError) return next(usersError);
      res.result.json = followings;
      break;
    case 2:
      const { followings: searchUsers, error } = await checkForFollowings({
        userName: req.headers.follower,
        followings: res.result.json[currentSchema.fields_path],
        path: currentSchema.field_name,
      });
      if (error) return next(error);
      res.result.json[currentSchema.fields_path] = searchUsers;
      break;
    case 3:
      const { following, error: e } = await checkForFollowingsSingle({
        userName: req.headers.follower,
        following: res.result.json,
        path: currentSchema.field_name,
      });
      if (e) return next(e);
      res.result.json = following;
      break;
  }
  next();
};

const checkForFollowings = async ({ userName, path, followings }) => {
  const permlinks = _.map(followings, (following) => following[path]);
  const { users: permlinksData, error } = await getFollowingsUser.getFollowingsArray(
    { name: userName, permlinks },
  );
  if (error) return { error };

  followings = _.forEach(followings, (following) => {
    const result = _.find(
      permlinksData,
      (permlink) => Object.keys(permlink)[0] === following[path],
    );
    following.youFollows = result[following[path]];
  });
  return { followings };
};

const checkForFollowingsSingle = async ({ userName, path, following }) => {
  const { users, error } = await getFollowingsUser.getFollowingsArray(
    { name: userName, permlinks: [following[path]] },
  );
  if (error) return { error };

  following.youFollows = users[0][following[path]];
  return { following };
};

const checkObjectFollowings = async (data, req) => {
  const currentSchema = schema.find((s) => s.path === _.get(req, 'route.path') && s.method === req.method);
  if (!currentSchema || !req.headers.follower) return data;

  switch (currentSchema.case) {
    case 1:
      const { followings, error: usersError } = await checkForFollowings({
        userName: req.headers.follower,
        followings: data,
        path: currentSchema.field_name,
      });
      if (usersError) return data;
      data = followings;
      break;
    case 2:
      const { followings: searchUsers, error } = await checkForFollowings({
        userName: req.headers.follower,
        followings: data[currentSchema.fields_path],
        path: currentSchema.field_name,
      });
      if (error) return data;
      data[currentSchema.fields_path] = searchUsers;
      break;
    case 3:
      const { following, error: e } = await checkForFollowingsSingle({
        userName: req.headers.follower,
        following: data,
        path: currentSchema.field_name,
      });
      if (e) return data;
      data = following;
      break;
  }
  return data;
};

module.exports = checkObjectFollowings;
