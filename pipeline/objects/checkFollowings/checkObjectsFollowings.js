const _ = require('lodash');
const { getFollowingsUser } = require('utilities/operations/user');
const { schema } = require('./schema');

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

const case1Processor = async ({ data, currentSchema, req }) => {
  const { followings, error: usersError } = await checkForFollowings({
    userName: req.headers.follower,
    followings: data,
    path: currentSchema.field_name,
  });
  if (usersError) return data;
  data = followings;

  return data;
};

const case2Processor = async ({ data, currentSchema, req }) => {
  const { followings: searchUsers, error } = await checkForFollowings({
    userName: req.headers.follower,
    followings: data[currentSchema.fields_path],
    path: currentSchema.field_name,
  });
  if (error) return data;
  data[currentSchema.fields_path] = searchUsers;

  return data;
};

const case3Processor = async ({ data, currentSchema, req }) => {
  const { following, error: e } = await checkForFollowingsSingle({
    userName: req.headers.follower,
    following: data,
    path: currentSchema.field_name,
  });
  if (e) return data;
  data = following;

  return data;
};

const defaultObjectProcessor = async ({ data }) => data;

const processors = {
  case1: case1Processor,
  case2: case2Processor,
  case3: case3Processor,
  default: defaultObjectProcessor,
};

const context = (processorName) => async (data) => {
  const processor = processors[processorName] || processors.default;
  return processor(data);
};

const checkObjectFollowings = async (data, req) => {
  const currentSchema = schema.find((s) => s.path === _.get(req, 'route.path')
    && s.method === req.method);
  if (!currentSchema || !req.headers.follower) return data;

  const handler = context(currentSchema.case);

  return handler({ data, currentSchema, req });
};

module.exports = checkObjectFollowings;
