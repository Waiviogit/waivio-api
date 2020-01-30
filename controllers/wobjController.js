const { Wobj, Post } = require('models');
const { followersHelper } = require('utilities/helpers');
const {
  objectExperts, wobjectInfo, getManyObjects,
  getPostsByWobject, getChildWobjects: getChild, getFields,
} = require('utilities/operations').wobject;
const { wobjects: { searchWobjects } } = require('utilities/operations').search;
const validators = require('controllers/validators');

const index = async (req, res, next) => {
  const value = validators.validate(
    {
      user_limit: req.body.user_limit,
      locale: req.body.locale,
      author_permlinks: req.body.author_permlinks,
      object_types: req.body.object_types,
      exclude_object_types: req.body.exclude_object_types,
      required_fields: req.body.required_fields,
      limit: req.body.limit,
      skip: req.body.skip,
      sample: req.body.sample,
    }, validators.wobject.indexSchema, next,
  );

  if (!value) return;

  const { wObjectsData, hasMore, error } = await getManyObjects.getMany(value);

  if (error) return next(error);

  res.result = { status: 200, json: { wobjects: wObjectsData, hasMore } };
  next();
};

const show = async (req, res, next) => {
  const value = validators.validate(
    {
      author_permlink: req.params.authorPermlink,
      locale: req.query.locale,
      required_fields: req.query.required_fields,
    }, validators.wobject.showSchema, next,
  );

  if (!value) return;

  const { wobjectData, error } = await wobjectInfo.getOne(value);

  if (error) return next(error);

  res.result = { status: 200, json: wobjectData };
  next();
};

const posts = async (req, res, next) => {
  const value = validators.validate(
    {
      author_permlink: req.params.authorPermlink,
      limit: req.body.limit,
      skip: req.body.skip,
      user_languages: req.body.user_languages,
    }, validators.wobject.postsScheme, next,
  );

  if (!value) return;

  const { posts: wobjectPosts, error } = await getPostsByWobject(value);

  if (error) return next(error);

  res.result = { status: 200, json: wobjectPosts };
  next();
};

const feed = async (req, res, next) => {
  const value = validators.validate(
    {
      filter: req.body.filter,
      limit: req.body.limit,
      skip: req.body.skip,
    }, validators.wobject.feedScheme, next,
  );

  if (!value) return;

  const { posts: AllPosts, error } = await Post.getAllPosts(value);

  if (error) {
    return next(error);
  }
  res.result = { status: 200, json: AllPosts };
  next();
};

const followers = async (req, res, next) => {
  const value = validators.validate(
    {
      author_permlink: req.params.authorPermlink,
      skip: req.body.skip,
      limit: req.body.limit,
    }, validators.wobject.followersScheme, next,
  );

  if (!value) return;

  const { followers: wobjectFollowers, error } = await followersHelper.getFollowers(value);

  if (error) {
    return next(error);
  }
  res.result = { status: 200, json: wobjectFollowers };
  next();
};

const search = async (req, res, next) => {
  const value = validators.validate(
    {
      string: req.body.search_string,
      limit: req.body.limit,
      skip: req.body.skip,
      locale: req.body.locale,
      object_type: req.body.object_type,
      sortByApp: req.body.sortByApp,
      forParent: req.body.forParent,
      required_fields: req.body.required_fields,
    }, validators.wobject.searchScheme, next,
  );

  if (!value) return;

  const { wobjects, error } = await searchWobjects(value);

  if (error) return next(error);

  res.result = { status: 200, json: wobjects };
  next();
};

const fields = async (req, res, next) => {
  const value = validators.validate(
    {
      author_permlink: req.params.authorPermlink,
      fields_names: req.body.fields_names,
      custom_fields: req.body.custom_fields,
    }, validators.wobject.fieldsScheme, next,
  );

  if (!value) return;

  const { fields: fieldsData, error } = await getFields(value);

  if (error) return next(error);

  res.result = { status: 200, json: fieldsData };
  req.author_permlink = req.params.authorPermlink;
  next();
};

const gallery = async (req, res, next) => {
  const value = validators.validate(
    {
      author_permlink: req.params.authorPermlink,
    }, validators.wobject.galleryScheme, next,
  );

  if (!value) return;

  const { gallery: wobjectGallery, error } = await Wobj.getGalleryItems(value);

  if (error) return next(error);

  res.result = { status: 200, json: wobjectGallery };
  req.author_permlink = req.params.authorPermlink;
  next();
};

const list = async (req, res, next) => {
  const value = validators.validate(
    {
      author_permlink: req.params.authorPermlink,
    }, validators.wobject.listScheme, next,
  );

  if (!value) return;

  const { wobjects, error } = await Wobj.getList(value.author_permlink);

  if (error) return next(error);

  res.result = { status: 200, json: wobjects };
  next();
};

const objectExpertise = async (req, res, next) => {
  const value = validators.validate(
    {
      author_permlink: req.params.authorPermlink,
      skip: req.body.skip,
      limit: req.body.limit,
      user: req.body.user,
    }, validators.wobject.objectExpertiseScheme, next,
  );

  if (!value) return;
  const { experts, user_expert: userExpert, error } = await objectExperts.getWobjExperts(value);

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
  const { wobjects, error } = await getChild(value);

  if (error) return next(error);
  res.result = { status: 200, json: wobjects };
  next();
};

module.exports = {
  index,
  show,
  posts,
  search,
  fields,
  followers,
  gallery,
  feed,
  list,
  objectExpertise,
  getByField,
  getChildWobjects,
};
