const { authorise } = require('utilities/authorization/authoriseUser');
const {
  getManyUsers, objectsShares, getOneUser, getUserFeed, updateMetadata,
  getComments, getMetadata, getBlog, getFollowingUpdates, getPostFilters,
  getFollowers, getFollowingsUser, importSteemUserBalancer,
  setMarkers, getObjectsFollow,
} = require('utilities/operations/user');
const { users: { searchUsers: searchByUsers } } = require('utilities/operations/search');
const validators = require('controllers/validators');

const index = async (req, res, next) => {
  const value = validators.validate(
    {
      limit: req.query.limit,
      skip: req.query.skip,
      sample: req.query.sample,
    }, validators.user.indexSchema, next,
  );
  if (!value) return;
  const { users, error } = await getManyUsers.getUsers(value);

  if (error) return next(error);

  res.result = { status: 200, json: users };
  next();
};

const show = async (req, res, next) => {
  const value = validators.validate({
    name: req.params.userName,
    with_followings: req.query.with_followings,
  }, validators.user.showSchema, next);

  await authorise(value.name);
  const { userData, error } = await getOneUser(value);

  if (error) return next(error);

  res.result = { status: 200, json: userData };
  next();
};

const updateUserMetadata = async (req, res, next) => {
  const value = validators.validate({
    user_name: req.params.userName,
    user_metadata: req.body.user_metadata || req.body.data.user_metadata,
  }, validators.user.updateMetadataSchema, next);

  if (!value) return;

  const { error: authError } = await authorise(value.user_name);

  if (authError) return next(authError);

  const { user_metadata: userMetadata, error } = await updateMetadata(value);

  if (error) return next(error);
  res.result = { status: 200, json: { user_metadata: userMetadata } };
  next();
};

const getUserMetadata = async (req, res, next) => {
  const {
    user_metadata: userMetadata,
    error, privateEmail,
  } = await getMetadata(req.params.userName);

  if (error) return next(error);

  if (req.query.onlyEmail) res.result = { status: 200, json: { privateEmail } };
  else res.result = { status: 200, json: { user_metadata: userMetadata, privateEmail } };
  next();
};

const objectsFollow = async (req, res, next) => {
  const value = validators.validate({
    name: req.params.userName,
    locale: req.body.locale,
    limit: req.body.limit,
    skip: req.body.skip,
  }, validators.user.objectsFollowSchema, next);

  if (!value) return;

  const { wobjects, error } = await getObjectsFollow(value);

  if (error) return next(error);

  res.result = { status: 200, json: wobjects };
  next();
};

const usersFollow = async (req, res, next) => {
  const value = validators.validate({
    name: req.params.userName,
    limit: req.query.limit,
    skip: req.query.skip,
    sort: req.query.sort,
  }, validators.user.usersFollowSchema, next);

  if (!value) return;

  const { result, error } = await getFollowingsUser.getAll(value);

  if (error) return next(error);

  res.result = { status: 200, json: result };
  next();
};

const feed = async (req, res, next) => {
  const value = validators.validate({
    name: req.params.userName,
    skip: req.body.skip,
    limit: req.body.limit,
    lastId: req.body.lastId,
    filter: req.body.filter,
    forApp: req.headers.app,
    user_languages: req.body.user_languages,
  }, validators.user.feedSchema, next);

  if (!value) return;

  const { posts, error } = await getUserFeed(value);

  if (error) return next(error);

  res.result = { status: 200, json: posts };
  res.params = req.params;
  next();
};

const blog = async (req, res, next) => {
  const value = validators.validate({
    name: req.params.userName, ...req.body,
  }, validators.user.blogSchema, next);

  if (!value) return;

  const { posts, error } = await getBlog(value);

  if (error) return next(error);

  res.result = { status: 200, json: posts };
  res.params = req.params;
  next();
};

const userObjectsShares = async (req, res, next) => {
  const value = validators.validate({
    name: req.params.userName,
    limit: req.body.limit,
    skip: req.body.skip,
    locale: req.body.locale,
    exclude_object_types: req.body.exclude_object_types,
    object_types: req.body.object_types,
  }, validators.user.objectsSharesSchema, next);

  if (!value) return;

  const { objects_shares: objectShares, error } = await objectsShares.getUserObjectsShares(value);

  if (error) return next(error);

  res.result = { status: 200, json: objectShares };
  next();
};

const postFilters = async (req, res, next) => {
  const value = validators.validate({
    name: req.params.userName,
    limit: req.query.limit,
    skip: req.query.skip,
  }, validators.user.getPostFiltersSchema, next);

  if (!value) return;

  const { posts, error } = await getPostFilters(value);

  if (error) return next(error);

  res.result = { status: 200, json: posts };
  next();
};

const searchUsers = async (req, res, next) => {
  const value = validators.validate({
    searchString: req.query.searchString,
    limit: req.query.limit,
    skip: req.query.skip,
    notGuest: req.query.notGuest,
  }, validators.user.searchSchema, next);

  if (!value) return;

  const { users, error } = await searchByUsers({ ...value, string: value.searchString });

  if (error) return next(error);

  res.result = { status: 200, json: users };
  next();
};

const followingUpdates = async (req, res, next) => {
  const value = validators.validate({
    name: req.params.userName,
    users_count: req.query.users_count,
    wobjects_count: req.query.wobjects_count,
  }, validators.user.followingUpdates, next);

  if (!value) return;

  const { result, error } = await getFollowingUpdates.getUpdatesSummary(value);

  if (error) return next(error);

  res.result = { status: 200, json: result };
  next();
};

const followingUsersUpdates = async (req, res, next) => {
  const value = validators.validate({
    name: req.params.userName,
    limit: req.query.limit,
    skip: req.query.skip,
  }, validators.user.followingUsersUpdates, next);

  if (!value) return;

  const { users_updates: usersUpdates, error } = await getFollowingUpdates.getUsersUpdates(value);

  if (error) return next(error);

  res.result = { status: 200, json: usersUpdates };
  next();
};

const followingWobjectsUpdates = async (req, res, next) => {
  const value = validators.validate({
    name: req.params.userName,
    limit: req.query.limit,
    skip: req.query.skip,
    object_type: req.query.object_type,
  }, validators.user.followingWobjectsUpdates, next);

  if (!value) return;

  const {
    wobjects_updates: wobjectsUpdates, error,
  } = await getFollowingUpdates.getWobjectsUpdates(value);

  if (error) return next(error);

  res.result = { status: 200, json: wobjectsUpdates };
  next();
};

const followers = async (req, res, next) => {
  const value = validators.validate({
    name: req.params.userName,
    limit: req.query.limit,
    skip: req.query.skip,
    sort: req.query.sort,
  }, validators.user.getFollowers, next);

  if (!value) return;

  const { result, error } = await getFollowers(value);

  if (error) return next(error);

  res.result = { status: 200, json: result };
  next();
};

const getUserComments = async (req, res, next) => {
  const value = validators.validate({
    name: req.params.userName,
    limit: req.query.limit,
    skip: req.query.skip,
    start_permlink: req.query.start_permlink,
  }, validators.user.comments, next);

  if (!value) return;

  const { comments, error } = await getComments(value);

  if (error) return next(error);

  res.result = { status: 200, json: comments };
  next();
};

const importUserFromSteem = async (req, res, next) => {
  if (!req.query.userName) return next({ status: 422, message: 'userName field must exist' });

  const { result, error } = await importSteemUserBalancer.startImportUser(req.query.userName);

  if (error) return next(error);

  res.result = { status: 200, json: result };
  next();
};

const followingsState = async (req, res, next) => {
  const value = validators.validate({
    name: req.params.userName,
    users: req.query.users,
  }, validators.user.followingsState, next);

  if (!value) return;

  const { users, error } = await getFollowingsUser.getFollowingsArray(value);

  if (error) return next(error);

  res.result = { status: 200, json: users };
  next();
};

const usersData = async (req, res, next) => {
  const value = validators.validate(req.body, validators.user.usersArray, next);
  if (!value) return;

  const { data, error } = await getManyUsers.getUsersByList(value);
  if (error) return next(error);

  res.result = { status: 200, json: data };
  next();
};

const modalWindowMarker = async (req, res, next) => {
  const result = await setMarkers.newUser(req.params.userName);
  res.result = { status: 200, json: { result } };
  next();
};

module.exports = {
  index,
  show,
  objectsFollow,
  usersFollow,
  feed,
  userObjectsShares,
  searchUsers,
  updateUserMetadata,
  getUserMetadata,
  blog,
  followingUpdates,
  followingUsersUpdates,
  followingWobjectsUpdates,
  postFilters,
  followers,
  getUserComments,
  importUserFromSteem,
  followingsState,
  usersData,
  modalWindowMarker,
};
