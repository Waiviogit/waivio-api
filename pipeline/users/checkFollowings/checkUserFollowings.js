const _ = require('lodash');
const { getFollowingsUser } = require('../../../utilities/operations/user');
const { schema } = require('../checkFollowers/schema');

const checkForFollowings = async ({ userName, path, followings }) => {
  const names = _.map(followings, (following) => following[path]);
  const { users, error } = await getFollowingsUser.getFollowingsArray(
    { name: userName, users: names },
  );
  if (error) return { error };

  followings = _.forEach(followings, (following) => {
    const result = _.find(users, (user) => Object.keys(user)[0] === following[path]);
    following.youFollows = result[following[path]];
  });
  return { followings };
};

const checkForFollowingsSingle = async ({ userName, path, following }) => {
  const { users, error } = await getFollowingsUser.getFollowingsArray(
    { name: userName, users: [following[path]] },
  );
  if (error) return { error };

  following.youFollows = users[0][following[path]];
  return { following };
};

const checkFollowings = async (data, req) => {
  const currentSchema = schema.find((s) => s.path === _.get(req, 'route.path') && s.method === req.method);

  if (!currentSchema || !req.headers.follower) {
    return data;
  }

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

module.exports = checkFollowings;
