const { authorise } = require('../utilities/authorization/authoriseUser');
const {
  getManyUsers, objectsShares, getOneUser, getUserFeed, updateMetadata,
  getComments, getMetadata, getBlog, getFollowingUpdates, getPostFilters,
  getFollowers, getFollowingsUser, importSteemUserBalancer, calcVoteValue,
  setMarkers, getObjectsFollow, geoData, getUserCreationDate, getUserDelegation,
  guestWalletOperations, getBlogTags, guestHiveWithdraw, favorites, userExist, guestMana, hiveWithdraw,
  getProfileImages, getUserRcDelegations,
} = require('../utilities/operations/user');
const { users: { searchUsers: searchByUsers, getSiteUsersByHost } } = require('../utilities/operations/search');
const { getIpFromHeaders } = require('../utilities/helpers/sitesHelper');
const validators = require('./validators');
const authoriseUser = require('../utilities/authorization/authoriseUser');
const { getUserLastActivity } = require('../utilities/operations/user/getUserLastActivity');
const { getWalletAdvancedReport } = require('../utilities/operations/user/getWalletAdvancedReport');
const { getUserPostTitles } = require('../utilities/operations/user/getUserPostsProjection');
const generatedReport = require('../utilities/operations/user/walletAdvancedReportGenerated');
const { getAffiliateObjects } = require('../utilities/operations/affiliateProgram/getAffiliateObjects');
const { getCountryCodeFromIp } = require('../utilities/helpers/sitesHelper');
const pipelineFunctions = require('../pipeline');
const RequestPipeline = require('../pipeline/requestPipeline');

const index = async (req, res, next) => {
  const value = validators.validate({
    limit: req.query.limit,
    skip: req.query.skip,
    sample: req.query.sample,
  }, validators.user.indexSchema, next);
  if (!value) return;
  const { users, error } = await getManyUsers.getUsers(value);

  if (error) return next(error);

  const pipeline = new RequestPipeline();
  const processedData = await pipeline
    .use(pipelineFunctions.checkFollowers)
    .use(pipelineFunctions.checkFollowings)
    .execute(users, req);

  return res.status(200).json(processedData);
};

const show = async (req, res, next) => {
  const value = validators.validate({
    name: req.params.userName,
    with_followings: req.query.with_followings,
    userName: req.headers.follower,
  }, validators.user.showSchema, next);

  if (!value) return;

  await authorise(value.name);
  const { userData, error } = await getOneUser({ ...value, app: req.appData });

  if (error) return next(error);

  const pipeline = new RequestPipeline();
  const processedData = await pipeline
    .use(pipelineFunctions.checkFollowers)
    .use(pipelineFunctions.checkFollowings)
    .use(pipelineFunctions.checkBellNotifications)
    .execute(userData, req);

  return res.status(200).json(processedData);
};
const showDelegation = async (req, res, next) => {
  const value = validators.validate({
    account: req.params.userName,
  }, validators.user.getDelegationSchema, next);

  if (!value) return;

  const { result, error } = await getUserDelegation(value);
  if (error) return next(error);

  return res.status(200).json(result);
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

  return res.status(200).json({ user_metadata: userMetadata });
};

const getUserMetadata = async (req, res, next) => {
  const {
    user_metadata: userMetadata,
    error, privateEmail,
  } = await getMetadata(req.params.userName);

  if (error) return next(error);

  if (req.query.onlyEmail) return res.status(200).json({ privateEmail });

  return res.status(200).json({ user_metadata: userMetadata, privateEmail });
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

  const pipeline = new RequestPipeline();
  const processedData = await pipeline
    .use(pipelineFunctions.moderateObjects)
    .use(pipelineFunctions.checkObjectFollowings)
    .execute(wobjects, req);

  return res.status(200).json(processedData);
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

  const pipeline = new RequestPipeline();
  const processedData = await pipeline
    .use(pipelineFunctions.checkFollowers)
    .use(pipelineFunctions.checkFollowings)
    .execute(result, req);

  return res.status(200).json(processedData);
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
    userName: req.headers.follower,
    locale: req.headers.locale,
  }, validators.user.feedSchema, next);

  if (!value) return;

  const { posts, error } = await getUserFeed({
    ...value, app: req.appData,
  });
  if (error) return next(error);

  return res.status(200).json(posts);
};

const blog = async (req, res, next) => {
  const value = validators.validate({
    name: req.params.userName, ...req.body, userName: req.headers.follower,
  }, validators.user.blogSchema, next);

  if (!value) return;

  const {
    posts, tags, hasMore, error,
  } = await getBlog({ ...value, app: req.appData });

  if (error) return next(error);

  const pipeline = new RequestPipeline();
  const processedData = await pipeline
    .use(pipelineFunctions.fillPosts)
    .use(pipelineFunctions.moderateObjects)
    .use(pipelineFunctions.checkFollowers)
    .use(pipelineFunctions.checkFollowings)
    .execute({ tags, posts, hasMore }, req);

  return res.status(200).json(processedData);
};

const blogTitles = async (req, res, next) => {
  const value = validators.validate({
    userName: req.params.userName, ...req.body,
  }, validators.user.blogTitleSchema, next);

  if (!value) return;

  const result = await getUserPostTitles(value);

  return res.status(200).json(result);
};

const blogTags = async (req, res, next) => {
  const value = validators.validate({
    name: req.params.userName, ...req.body,
  }, validators.user.blogTagsSchema, next);

  if (!value) return;

  const {
    tags, hasMore,
  } = await getBlogTags(value);

  return res.status(200).json({ tags, hasMore });
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

  const pipeline = new RequestPipeline();
  const processedData = await pipeline
    .use(pipelineFunctions.moderateObjects)
    .use(pipelineFunctions.checkObjectFollowings)
    .execute(objectShares, req);

  return res.status(200).json(processedData);
};

const userObjectsSharesCount = async (req, res, next) => {
  const { hashtagsExpCount, wobjectsExpCount, error } = await objectsShares
    .getUserObjectsSharesCounters(req.params.userName);

  if (error) return next(error);

  return res.status(200).json({ hashtagsExpCount, wobjectsExpCount });
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

  return res.status(200).json(posts);
};

const searchUsers = async (req, res, next) => {
  const value = validators.validate({
    searchString: req.query.searchString,
    limit: req.query.limit,
    skip: req.query.skip,
    notGuest: req.query.notGuest,
  }, validators.user.searchSchema, next);

  if (!value) return;

  const { users, hasMore, error } = await searchByUsers({ ...value, string: value.searchString });

  if (error) return next(error);

  const pipeline = new RequestPipeline();
  const processedData = await pipeline
    .use(pipelineFunctions.checkFollowers)
    .use(pipelineFunctions.checkFollowings)
    .execute({ users, hasMore }, req);

  return res.status(200).json(processedData);
};

const searchUsersByHost = async (req, res, next) => {
  const value = validators.validate(req.body, validators.user.searchByHostSchema, next);
  if (!value) return;

  const { users, hasMore, error } = await getSiteUsersByHost(value);
  if (error) return next(error);

  return res.status(200).json({ users, hasMore });
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

  const pipeline = new RequestPipeline();
  const processedData = await pipeline
    .use(pipelineFunctions.moderateObjects)
    .execute(result, req);

  return res.status(200).json(processedData);
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

  return res.status(200).json(usersUpdates);
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

  return res.status(200).json(wobjectsUpdates);
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

  const pipeline = new RequestPipeline();
  const processedData = await pipeline
    .use(pipelineFunctions.checkFollowers)
    .use(pipelineFunctions.checkFollowings)
    .execute(result, req);

  return res.status(200).json(processedData);
};

const getUserComments = async (req, res, next) => {
  const value = validators.validate({
    name: req.params.userName,
    limit: req.query.limit,
    skip: req.query.skip,
    start_permlink: req.query.start_permlink,
    userName: req.headers.follower,
  }, validators.user.comments, next);

  if (!value) return;

  const { comments, error } = await getComments({ ...value, app: req.appData });
  if (error) return next(error);

  return res.status(200).json(comments);
};

const importUserFromSteem = async (req, res, next) => {
  if (!req.query.userName) return next({ status: 422, message: 'userName field must exist' });

  const { result, error } = await importSteemUserBalancer.startImportUser(req.query.userName);
  if (error) return next(error);

  return res.status(200).json(result);
};

const followingsState = async (req, res, next) => {
  const value = validators.validate({
    name: req.params.userName,
    users: req.query.users,
  }, validators.user.followingsState, next);

  if (!value) return;

  const { users, error } = await getFollowingsUser.getFollowingsArray(value);
  if (error) return next(error);

  return res.status(200).json(users);
};

const usersData = async (req, res, next) => {
  const value = validators.validate(req.body, validators.user.usersArray, next);
  if (!value) return;

  const { data, error } = await getManyUsers.getUsersByList(value);
  if (error) return next(error);

  const pipeline = new RequestPipeline();
  const processedData = await pipeline
    .use(pipelineFunctions.checkFollowers)
    .use(pipelineFunctions.checkFollowings)
    .execute(data, req);

  return res.status(200).json(processedData);
};

const modalWindowMarker = async (req, res, next) => {
  const result = await setMarkers.newUser(req.params.userName);

  return res.status(200).json({ result });
};

const getVoteValue = async (req, res, next) => {
  const value = validators
    .validate({ ...req.query, ...req.params }, validators.user.voteValue, next);
  if (!value) return;

  const result = await calcVoteValue.sliderCalc(value);

  return res.status(200).json({ result });
};

const getEstimatedVote = async (req, res, next) => {
  const result = await calcVoteValue.userInfoCalc(req.params);

  return res.status(200).json(result);
};

const checkObjectWhiteList = async (req, res, next) => {
  const result = await calcVoteValue.checkUserWhiteList(req.params);

  return res.status(200).json(result);
};

const getWaivVote = async (req, res, next) => {
  const value = validators
    .validate({ ...req.query, ...req.params }, validators.user.waivVoteValue, next);
  if (!value) return;

  const result = await calcVoteValue.waivVoteUSD(value);

  return res.status(200).json(result);
};

const getGeoByIp = async (req, res, next) => {
  const { longitude, latitude } = await geoData.getLocation(getIpFromHeaders(req));

  return res.status(200).json({ longitude, latitude });
};

const putUserGeo = async (req, res, next) => {
  const value = validators.validate(
    { ...req.body, ip: getIpFromHeaders(req) },
    validators.user.putGeo,
    next,
  );
  if (!value) return;

  const { longitude, latitude, error } = await geoData.putLocation({ req, ...value });
  if (error) return next(error);

  return res.status(200).json({ longitude, latitude });
};

const getCreationDate = async (req, res, next) => {
  const { timestamp, error } = await getUserCreationDate(req.params.userName);
  if (error) return next(error);

  return res.status(200).json({ timestamp });
};

const getLastActivity = async (req, res, next) => {
  const { lastActivity, error } = await getUserLastActivity(req.params.userName);
  if (error) return next(error);

  return res.status(200).json({ lastActivity });
};

const getAdvancedReport = async (req, res, next) => {
  const value = validators.validate(
    { ...req.body },
    validators.user.advancedWalletSchema,
    next,
  );
  if (!value) return;

  const { result, error } = await getWalletAdvancedReport(value);

  if (error) {
    console.error('getAdvancedReport: Error from getWalletAdvancedReport:', {
      errorMessage: error.message,
      errorStack: error.stack,
      errorType: typeof error,
      errorConstructor: error.constructor?.name,
    });
    return next(error);
  }

  return res.status(200).json(result);
};

const generateAdvancedReport = async (req, res, next) => {
  const value = validators.validate(
    req.body,
    validators.user.advancedWalletGenerateSchema,
    next,
  );
  if (!value) return;

  const { error: authError } = await authoriseUser.authorise(value.user);
  if (authError) return next(authError);

  const { result, error } = await generatedReport.generateReportTask(value);
  if (error) return next(error);

  return res.status(200).json(result);
};

const reportsInProgress = async (req, res, next) => {
  const value = validators.validate(
    req.body,
    validators.user.reportsInProgressSchema,
    next,
  );
  if (!value) return;

  const { result, error } = await generatedReport.getInProgress(value);
  if (error) return next(error);

  return res.status(200).json(result);
};

const reportsHistory = async (req, res, next) => {
  const value = validators.validate(
    req.body,
    validators.user.reportsHistorySchema,
    next,
  );
  if (!value) return;

  const { result, error } = await generatedReport.getHistory(value);
  if (error) return next(error);

  return res.status(200).json(result);
};

const selectDeselectRecord = async (req, res, next) => {
  const value = validators.validate(
    req.body,
    validators.user.selectDeselectRecordSchema,
    next,
  );
  if (!value) return;

  const { error: authError } = await authoriseUser.authorise(value.user);
  if (authError) return next(authError);

  const { result, error } = await generatedReport.selectDeselectRecord(value);
  if (error) return next(error);

  return res.status(200).json(result);
};

const getGeneratedReport = async (req, res, next) => {
  const value = validators.validate(
    req.body,
    validators.user.getGeneratedReportSchema,
    next,
  );
  if (!value) return;

  const { result, error } = await generatedReport.getGeneratedReport(value);
  if (error) return next(error);

  return res.status(200).json(result);
};

const resumeGeneratedReport = async (req, res, next) => {
  const value = validators.validate(
    req.body,
    validators.user.resumeGeneratedReportSchema,
    next,
  );
  if (!value) return;

  const { error: authError } = await authoriseUser.authorise(value.user);
  if (authError) return next(authError);

  const { result, error } = await generatedReport.resumeGeneration(value);
  if (error) return next(error);

  return res.status(200).json(result);
};

const stopGeneratedReport = async (req, res, next) => {
  const value = validators.validate(
    req.body,
    validators.user.stopGeneratedReportSchema,
    next,
  );
  if (!value) return;

  const { error: authError } = await authoriseUser.authorise(value.user);
  if (authError) return next(authError);

  const { result, error } = await generatedReport.stopGeneration(value);
  if (error) return next(error);

  return res.status(200).json(result);
};

const pauseGeneratedReport = async (req, res, next) => {
  const value = validators.validate(
    req.body,
    validators.user.pauseGeneratedReportSchema,
    next,
  );
  if (!value) return;

  const { error: authError } = await authoriseUser.authorise(value.user);
  if (authError) return next(authError);

  const { result, error } = await generatedReport.pauseGeneration(value);
  if (error) return next(error);

  return res.status(200).json(result);
};

const getGuestWallet = async (req, res, next) => {
  const value = validators.validate({ ...req.query, ...req.params }, validators.user.guestWallet, next);
  if (!value) return;
  const { result, error } = await guestWalletOperations.getWallet(value);
  if (error) return next(error);

  return res.status(200).json(result);
};

const getGuestBalance = async (req, res, next) => {
  const value = validators.validate({ ...req.query, ...req.params }, validators.user.guestBalance, next);
  if (!value) return;
  const { result, error } = await guestWalletOperations.getBalance(value);

  if (error) return next(error);

  return res.status(200).json(result);
};

const getGuestMana = async (req, res, next) => {
  const value = validators.validate(req.params, validators.user.guestMana, next);
  if (!value) return;
  const json = await guestMana.getCurrentManaPercent(value);

  return res.status(200).json(json);
};

const guestWithdrawHive = async (req, res, next) => {
  const value = validators.validate(
    req.body,
    validators.user.guestWithdrawHiveSchema,
    next,
  );
  if (!value) return;

  const { error: authError } = await authorise(value.userName);
  if (authError) return next(authError);

  const { result, error } = await guestHiveWithdraw.withdrawFromHive(value);
  if (error) return next(error);

  return res.status(200).json(result);
};

const withdrawHive = async (req, res, next) => {
  const value = validators.validate(
    req.body,
    validators.user.guestWithdrawHiveSchema,
    next,
  );
  if (!value) return;

  const { error: authError } = await authorise(value.userName);
  if (authError) return next(authError);

  const { result, error } = await hiveWithdraw.withdrawFromHive(value);
  if (error) return next(error);

  return res.status(200).json(result);
};

const guestWithdrawHiveEstimates = async (req, res, next) => {
  const value = validators.validate(
    req.body,
    validators.user.guestWithdrawHiveEstimatesSchema,
    next,
  );
  if (!value) return;

  const { result, error } = await guestHiveWithdraw.withdrawEstimates(value);
  if (error) return next(error);

  return res.status(200).json({ result });
};

const guestWithdrawHiveRange = async (req, res, next) => {
  const value = validators.validate(
    req.body,
    validators.user.guestWithdrawHiveRangeSchema,
    next,
  );
  if (!value) return;

  const { result, error } = await guestHiveWithdraw.withdrawRange(value);
  if (error) return next(error);

  return res.status(200).json(result);
};

const getAffiliate = async (req, res, next) => {
  const value = validators.validate({
    userName: req.params.userName,
    ...req.body,
  }, validators.user.getAffiliateSchema, next);
  if (!value) return;

  const { result, error } = await getAffiliateObjects({
    ...value,
    app: req.appData,
  });
  if (error) return next(error);

  return res.status(200).json(result);
};

const getMinReject = async (req, res, next) => {
  const value = validators
    .validate(req.body, validators.user.minRejectSchema, next);
  if (!value) return;

  const json = await calcVoteValue.getMinReject(value);

  return res.status(200).json(json);
};

const getFavoritesList = async (req, res, next) => {
  const { result, error } = await favorites.getUserFavoritesList(req.params);
  if (error) return next(error);

  return res.status(200).json(result);
};

const getFavorites = async (req, res, next) => {
  const value = validators.validate({
    ...req.params,
    ...req.body,
    follower: req.headers.follower,
    locale: req.headers.locale,
  }, validators.user.getFavoritesSchema, next);
  if (!value) return;

  const countryCode = await getCountryCodeFromIp(getIpFromHeaders(req));

  const { result, hasMore, error } = await favorites.getFavorites({
    ...value,
    app: req.appData,
    countryCode,
  });

  if (error) return next(error);

  return res.status(200).json({ result, hasMore });
};

const getFavouritesMap = async (req, res, next) => {
  const value = validators.validate({
    ...req.params,
    ...req.body,
    follower: req.headers.follower,
    locale: req.headers.locale,
  }, validators.user.getFavoritesMapSchema, next);
  if (!value) return;

  const { result, hasMore, error } = await favorites.getFavoritesMap({
    ...value,
    app: req.appData,
  });
  if (error) return next(error);

  return res.status(200).json({ result, hasMore });
};

const hiveUserExist = async (req, res, next) => {
  const json = await userExist.hiveUserExist(req.params);

  return res.status(200).json(json);
};

const getAvatars = async (req, res, next) => {
  const value = validators.validate(req.body, validators.user.getAvatarsSchema, next);
  if (!value) return;
  const result = await getProfileImages(value);

  return res.status(200).json(result);
};

const getIncomingRcDelegations = async (req, res, next) => {
  const value = validators.validate(
    req.query,
    validators.user.rcIncomingSchema,
    next,
  );
  if (!value) return;

  const result = await getUserRcDelegations.getIncomingDelegations(value);

  return res.status(200).json(result);
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
  userObjectsSharesCount,
  getVoteValue,
  getGeoByIp,
  putUserGeo,
  getCreationDate,
  getEstimatedVote,
  showDelegation,
  getLastActivity,
  getAdvancedReport,
  getGuestWallet,
  getGuestBalance,
  blogTags,
  getWaivVote,
  checkObjectWhiteList,
  guestWithdrawHive,
  guestWithdrawHiveEstimates,
  guestWithdrawHiveRange,
  getAffiliate,
  getMinReject,
  getFavoritesList,
  getFavorites,
  hiveUserExist,
  getGuestMana,
  getAvatars,
  generateAdvancedReport,
  reportsInProgress,
  reportsHistory,
  selectDeselectRecord,
  getGeneratedReport,
  resumeGeneratedReport,
  stopGeneratedReport,
  pauseGeneratedReport,
  getFavouritesMap,
  searchUsersByHost,
  withdrawHive,
  getIncomingRcDelegations,
  blogTitles,
};
