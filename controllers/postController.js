const {
  getPostsByCategory, getSinglePost, getPostComments,
  getManyPosts, getPostSocialInfo, likePost,
  cachePreview, getPostsByMention,
} = require('utilities/operations').post;
const validators = require('controllers/validators');
const authoriseUser = require('utilities/authorization/authoriseUser');
const pipelineFunctions = require('../pipeline');
const RequestPipeline = require('../pipeline/requestPipeline');

exports.show = async (req, res, next) => {
  const value = validators.validate({
    author: req.params.author,
    permlink: req.params.permlink,
    userName: req.headers.follower,
  }, validators.post.showSchema, next);

  if (!value) return;
  const { post, error } = await getSinglePost(value);
  if (error) return next(error);

  const pipeline = new RequestPipeline();
  const processedData = await pipeline
    .use(pipelineFunctions.fillPosts)
    .use(pipelineFunctions.moderateObjects)
    .use(pipelineFunctions.checkFollowers)
    .use(pipelineFunctions.checkFollowings)
    .execute(post, req);

  return res.status(200).json(processedData);
};

exports.getByCategory = async (req, res, next) => {
  const value = validators.validate({
    category: req.body.category,
    limit: req.body.limit,
    skip: req.body.skip,
    user_languages: req.body.user_languages,
    forApp: req.headers.app,
    lastId: req.body.lastId,
    onlyCrypto: req.body.onlyCrypto,
    userName: req.headers.follower,
    locale: req.headers.locale,
  }, validators.post.getPostsByCategorySchema, next);

  if (!value) return;

  const { posts, error } = await getPostsByCategory({ ...value, app: req.appData });
  if (error) return next(error);

  return res.status(200).json(posts);
};

exports.getPostComments = async (req, res, next) => {
  const value = validators.validate({ ...req.query }, validators.post.getPostComments, next);

  if (!value) return;

  const { result, error } = await getPostComments({ ...value, app: req.appData });

  if (error) return next(error);

  return res.status(200).json(result);
};

exports.likePost = async (req, res, next) => {
  const value = validators.validate(req.body, validators.post.likePost, next);
  if (!value) return;

  const { error: authError } = await authoriseUser.authorise(value.voter);
  if (authError) return next(authError);

  const { post, error } = await likePost(value);

  if (error) return next(error);

  const pipeline = new RequestPipeline();
  const processedData = await pipeline
    .use(pipelineFunctions.fillPosts)
    .use(pipelineFunctions.moderateObjects)
    .execute(post, req);

  return res.status(200).json(processedData);
};

exports.getManyPosts = async (req, res, next) => {
  const value = validators.validate(req.body, validators.post.getManyPosts, next);

  if (!value) return;

  const { posts, error } = await getManyPosts(value);

  if (error) return next(error);

  const pipeline = new RequestPipeline();
  const processedData = await pipeline
    .use(pipelineFunctions.fillPosts)
    .use(pipelineFunctions.moderateObjects)
    .execute(posts, req);

  return res.status(200).json(processedData);
};

exports.getSocialInfo = async (req, res, next) => {
  const value = validators.validate(req.query, validators.post.showSchema, next);

  if (!value) return;

  const { result, error } = await getPostSocialInfo({ ...value, app: req.appData });

  if (error) return next(error);

  return res.status(200).json(result);
};

exports.getPreviewLinks = async (req, res, next) => {
  const value = validators.validate(req.body, validators.post.previewScema, next);

  if (!value) return;

  const json = await cachePreview.getLinks(value);

  return res.status(200).json(json);
};

exports.putPreviewUrl = async (req, res, next) => {
  const value = validators.validate(req.body, validators.post.previewPutScema, next);

  if (!value) return;

  const json = await cachePreview.putLinks(value);

  return res.status(200).json(json);
};

exports.getPostsByMentions = async (req, res, next) => {
  const value = validators.validate(
    {
      ...req.body,
      follower: req.headers.follower,
    },

    validators.post.mentionsSchema,
    next,
  );

  if (!value) return;

  const { posts, hasMore, error } = await getPostsByMention({ ...value, app: req.appData });

  if (error) return next(error);

  const pipeline = new RequestPipeline();
  const processedData = await pipeline
    .use(pipelineFunctions.fillPosts)
    .use(pipelineFunctions.moderateObjects)
    .use(pipelineFunctions.checkFollowers)
    .use(pipelineFunctions.checkFollowings)
    .execute({ posts, hasMore }, req);

  return res.status(200).json(processedData);
};
