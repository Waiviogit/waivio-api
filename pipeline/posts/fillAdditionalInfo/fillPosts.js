const _ = require('lodash');
const { postHelper } = require('utilities/helpers');
const { schema } = require('./schema');
/**
 * Middleware which fill some specific info on each post before send those to client.
 * - fill wobjects on post by full info about wobjects(with fields and others);
 * - add current "author_wobjects_weight" to each post;
 * @param req express request
 * @param res express response
 * @param next express func. get control to next middleware
 * @returns {Promise<void>}
 */

const fillPosts = async (data, req) => {
  const currentSchema = schema
    .find((s) => s.path === _.get(req, 'route.path') && s.method === req.method);

  if (!currentSchema) return data;

  const userName = _.get(
    req,
    'params.userName',
    _.get(req, 'headers.follower', req.headers.following),
  );
  const requestUserName = req.headers.follower;

  // separate requests which return array of posts and which return single post
  switch (currentSchema.case) {
    case 1:
      // replace reblog post blank to source post
      await postHelper.fillReblogs(data, userName);
      // fill wobjects on post by full info about wobjects(with fields and others);
      data = await postHelper.fillObjects(data, userName);
      // add current "author_wobjects_weight" to each post;
      await postHelper.addAuthorWobjectsWeight(data);
      // if review  add additional sponsor obligations to calculations
      data = await postHelper.additionalSponsorObligations(data, userName, requestUserName);
      break;
    case 2:
      // replace reblog post blank to source post
      await postHelper.fillReblogs([data], userName);
      // fill wobjects on post by full info about wobjects(with fields and others);
      [data] = await postHelper.fillObjects([data], userName);
      // add current "author_wobjects_weight" to each post;
      await postHelper.addAuthorWobjectsWeight([data], _.get(req, 'headers.app'), userName);
      // if review  add additional sponsor obligations to calculations
      [data] = await postHelper.additionalSponsorObligations([data], userName, requestUserName);
      break;
    case 3:
      // replace reblog post blank to source post
      await postHelper.fillReblogs(data.posts, userName);
      // fill wobjects on post by full info about wobjects(with fields and others);
      data.posts = await postHelper.fillObjects(data.posts, userName);
      // add current "author_wobjects_weight" to each post;
      await postHelper.addAuthorWobjectsWeight(data.posts);
      // if review  add additional sponsor obligations to calculations
      data.posts = await postHelper.additionalSponsorObligations(data.posts, userName, requestUserName);
      break;
    case 4:
      const iteratedArray = data[currentSchema.pathToArray];
      for (let i = 0; i < iteratedArray.length; i++) {
        const posts = await postHelper
          .additionalSponsorObligations([iteratedArray[i][currentSchema.pathToPost]], userName, requestUserName);
        if (_.isEmpty(posts)) continue;
        data[currentSchema.pathToArray][i][currentSchema.pathToPost] = posts[0];
      }
      break;
  }
  return data;
};

module.exports = fillPosts;
