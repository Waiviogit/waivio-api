const _ = require('lodash');
const { schema } = require('middlewares/posts/fillAdditionalInfo/schema');
const { postHelper, campaignsHelper } = require('utilities/helpers');
const userModel = require('models/UserModel');
/**
 * Middleware which fill some specific info on each post before send those to client.
 * - fill wobjects on post by full info about wobjects(with fields and others);
 * - add current "author_wobjects_weight" to each post;
 * @param req express request
 * @param res express response
 * @param next express func. get control to next middleware
 * @returns {Promise<void>}
 */
exports.fill = async (req, res, next) => {
  const currentSchema = schema.find((s) => s.path === _.get(req, 'route.path') && s.method === req.method);

  if (!currentSchema) return next();

  const userName = _.get(req, 'params.userName', _.get(req, 'headers.follower', req.headers.following));
  // separate requests which return array of posts and which return single post
  if (_.isArray(res.result.json)) {
    // replace reblog post blank to source post
    await postHelper.fillReblogs(res.result.json, userName);
    // fill wobjects on post by full info about wobjects(with fields and others);
    res.result.json = await fillObjects(res.result.json, userName);
    // add current "author_wobjects_weight" to each post;
    await postHelper.addAuthorWobjectsWeight(res.result.json);
  } else {
    // replace reblog post blank to source post
    await postHelper.fillReblogs([res.result.json], userName);
    // fill wobjects on post by full info about wobjects(with fields and others);
    [res.result.json] = await fillObjects([res.result.json]);
    // add current "author_wobjects_weight" to each post;
    await postHelper.addAuthorWobjectsWeight(
      [res.result.json], _.get(req, 'headers.app'), userName,
    );
  }
  next();
};

const fillObjects = async (posts, userName, wobjectsPath = 'fullObjects') => {
  let user;
  if (userName) {
    ({ user } = await userModel.getOne(userName));
  }
  for (const post of posts) {
    for (let wObject of _.get(post, 'wobjects') || []) {
      wObject = Object.assign(wObject, _.get(post, `[${wobjectsPath}]`, []).find((i) => i.author_permlink === wObject.author_permlink));
    }
    post.wobjects = _.filter(post.wobjects || [], (obj) => _.isString(obj.object_type));
    post.wobjects = await campaignsHelper.addCampaignsToWobjects(
      { wobjects: post.wobjects, user },
    );
    delete post[wobjectsPath];
  }
  return posts;
};
