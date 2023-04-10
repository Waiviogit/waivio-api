const _ = require('lodash');
const { schema } = require('middlewares/posts/fillAdditionalInfo/schema');
const { postHelper } = require('utilities/helpers');
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
  switch (currentSchema.case) {
    case 1:
      // replace reblog post blank to source post
      await postHelper.fillReblogs(res.result.json, userName);
      // fill wobjects on post by full info about wobjects(with fields and others);
      res.result.json = await postHelper.fillObjects(res.result.json, userName);
      // add current "author_wobjects_weight" to each post;
      await postHelper.addAuthorWobjectsWeight(res.result.json);
      // if review  add additional sponsor obligations to calculations
      res.result.json = await postHelper.additionalSponsorObligations(res.result.json, userName);
      break;
    case 2:
      // replace reblog post blank to source post
      await postHelper.fillReblogs([res.result.json], userName);
      // fill wobjects on post by full info about wobjects(with fields and others);
      [res.result.json] = await postHelper.fillObjects([res.result.json], userName);
      // add current "author_wobjects_weight" to each post;
      await postHelper.addAuthorWobjectsWeight(
        [res.result.json], _.get(req, 'headers.app'), userName,
      );
      // if review  add additional sponsor obligations to calculations
      [res.result.json] = await postHelper.additionalSponsorObligations([res.result.json], userName);
      break;
    case 3:
      // replace reblog post blank to source post
      await postHelper.fillReblogs(res.result.json.posts, userName);
      // fill wobjects on post by full info about wobjects(with fields and others);
      res.result.json.posts = await postHelper.fillObjects(res.result.json.posts, userName);
      // add current "author_wobjects_weight" to each post;
      await postHelper.addAuthorWobjectsWeight(res.result.json.posts);
      // if review  add additional sponsor obligations to calculations
      res.result.json.posts = await postHelper.additionalSponsorObligations(res.result.json.posts, userName);
      break;
    case 4:
      const iteratedArray = res.result.json[currentSchema.pathToArray];
      for (let i = 0; i < iteratedArray.length; i++) {
        const posts = await postHelper.additionalSponsorObligations([iteratedArray[i][currentSchema.pathToPost]], userName);
        if (_.isEmpty(posts)) continue;
        res.result.json[currentSchema.pathToArray][i][currentSchema.pathToPost] = posts[0];
      }
      break;
  }
  next();
};
