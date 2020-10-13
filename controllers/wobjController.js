const { Wobj, Post } = require('models');
const {
  objectExperts, wobjectInfo, getManyObjects,
  getPostsByWobject, getGallery, getWobjField, sortFollowers,
} = require('utilities/operations').wobject;
const { wobjects: { searchWobjects } } = require('utilities/operations').search;
const validators = require('controllers/validators');

const index = async (req, res, next) => {
  const value = validators.validate({
    user_limit: req.body.userLimit,
    locale: req.body.locale,
    author_permlinks: req.body.author_permlinks,
    object_types: req.body.object_types,
    exclude_object_types: req.body.exclude_object_types,
    required_fields: req.body.required_fields,
    limit: req.body.limit,
    skip: req.body.skip,
    sample: req.body.sample,
    map: req.body.map,
  }, validators.wobject.indexSchema, next);

  if (!value) return;

  const { wObjectsData, hasMore, error } = await getManyObjects.getMany(value);

  if (error) return next(error);

  res.result = { status: 200, json: { wobjects: wObjectsData, hasMore } };
  next();
};

// flag - Temporary solution
const show = async (req, res, next) => {
  const value = validators.validate({
    author_permlink: req.params.authorPermlink,
    locale: req.headers.locale,
    listCounters: req.query.listCounters,
    user: req.query.user,
    appName: req.headers.app,
  }, validators.wobject.showSchema, next);

  if (!value) return;

  const { wobjectData, error } = await wobjectInfo.getOne(value);

  if (error) return next(error);

  res.result = { status: 200, json: wobjectData };
  next();
};

const posts = async (req, res, next) => {
  const value = validators.validate({
    author_permlink: req.params.authorPermlink,
    limit: req.body.limit,
    skip: req.body.skip,
    user_languages: req.body.user_languages,
    forApp: req.headers.app,
    lastId: req.body.lastId,
  }, validators.wobject.postsScheme, next);

  if (!value) return;

  const { posts: wobjectPosts, error } = await getPostsByWobject(value);

  if (error) return next(error);

  res.result = { status: 200, json: wobjectPosts };
  next();
};

const feed = async (req, res, next) => {
  const value = validators.validate({
    filter: req.body.filter,
    limit: req.body.limit,
    skip: req.body.skip,
  }, validators.wobject.feedScheme, next);

  if (!value) return;

  const { posts: AllPosts, error } = await Post.getAllPosts(value);

  if (error) {
    return next(error);
  }
  res.result = { status: 200, json: AllPosts };
  next();
};

const followers = async (req, res, next) => {
  const value = validators.validate({
    author_permlink: req.params.authorPermlink,
    ...req.body,
  }, validators.wobject.followersScheme, next);

  if (!value) return;

  const { result } = await sortFollowers(value);

  res.result = { status: 200, json: result };
  next();
};

const search = async (req, res, next) => {
  const value = validators.validate({
    string: req.body.search_string,
    limit: req.body.limit,
    skip: req.body.skip,
    locale: req.body.locale,
    tagCategory: req.body.tagCategory,
    object_type: req.body.object_type,
    sortByApp: req.body.sortByApp,
    sort: req.body.sort,
    forParent: req.body.forParent,
    userName: req.body.userName,
    map: req.body.map,
    simplified: req.body.simplified,
    required_fields: req.body.required_fields,
  }, validators.wobject.searchScheme, next);

  if (!value) return;

  const { wobjects, error } = await searchWobjects(value);

  if (error) return next(error);

  res.result = { status: 200, json: wobjects };
  next();
};

const gallery = async (req, res, next) => {
  const value = validators.validate({
    authorPermlink: req.params.authorPermlink,
    locale: req.headers.locale,
    app: req.headers.app,
  }, validators.wobject.galleryScheme, next);

  if (!value) return;

  const { result, error } = await getGallery(value);

  if (error) return next(error);

  res.result = { status: 200, json: result };
  req.author_permlink = req.params.authorPermlink;
  next();
};

const objectExpertise = async (req, res, next) => {
  const value = validators.validate({
    author_permlink: req.params.authorPermlink,
    skip: req.body.skip,
    limit: req.body.limit,
    user: req.body.user,
  }, validators.wobject.objectExpertiseScheme, next);

  if (!value) return;
  const { experts, userExpert, error } = await objectExperts.getWobjExperts(value);

  if (error) {
    return next(error);
  }
  res.result = { status: 200, json: { users: experts, user: userExpert } };
  next();
};

const getByField = async (req, res, next) => {
  const value = validators.validate({
    fieldName: req.query.fieldName,
    fieldBody: req.query.fieldBody,
  }, validators.wobject.getByFieldScheme, next);

  if (!value) return;
  const { wobjects, error } = await Wobj.getByField(value);

  if (error) return next(error);
  res.result = { status: 200, json: wobjects };
  next();
};

const getChildWobjects = async (req, res, next) => {
  const value = validators.validate({
    skip: req.query.skip,
    limit: req.query.limit,
    author_permlink: req.params.authorPermlink,
  }, validators.wobject.getChildWobjects, next);

  if (!value) return;
  const { wobjects, error } = await Wobj.getChildWobjects(value);

  if (error) return next(error);
  res.result = { status: 200, json: wobjects };
  next();
};

const getWobjectField = async (req, res, next) => {
  const value = validators.validate(Object.assign(req.query, {
    locale: req.headers.locale,
    app: req.headers.app,
    authorPermlink: req.params.authorPermlink,
  }),
  validators.wobject.getWobjectField, next);
  if (!value) return;
  const { toDisplay, field, error } = await getWobjField(value);

  if (error) return next(error);
  res.result = { status: 200, json: { toDisplay, field } };
  next();
};

module.exports = {
  index,
  show,
  posts,
  search,
  followers,
  gallery,
  feed,
  objectExpertise,
  getByField,
  getChildWobjects,
  getWobjectField,
};
