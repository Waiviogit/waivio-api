const _ = require('lodash');
const { schema } = require('middlewares/wobject/moderation/schema');
const { App } = require('models');
const wobjectHelper = require('utilities/helpers/wObjectHelper');
const { REQUIREDFIELDS_POST } = require('utilities/constants');

exports.moderate = async (req, res, next) => {
  /*
    First need to find app of current request, then correct scheme of
    location wobjects data in response, and then moderate it if need

    data locate on "res.result" => {status, json}
    app locate on "res.headers.app"
    */
  const { app, error: getAppErr } = await getApp(req);

  if (getAppErr || !app) {
    next();
    return;
  }
  const currentSchema = schema.find((s) => s.path === req.route.path && s.method === req.method);

  if (!currentSchema) {
    next();
    return;
  }
  switch (currentSchema.case) {
    case 1:
      // root result is single wobject
      res.result.json = await wobjectHelper.processWobjects({
        wobjects: [res.result.json],
        admins: app.admins,
        hiveData: true,
        returnArray: false,
        locale: req.headers.locale,
      });
      break;
    case 2:
      res.result.json = await newValidation(res.result.json, app.admins || [], req.headers.locale);
      break;
    case 4:
      res.result.json = await newValidationArray(res.result.json, app.admins, req.headers.locale, currentSchema.wobjects_path);
      break;
    case 6:
      res.result.json[currentSchema.wobjects_path] = await newValidation(
        res.result.json[currentSchema.wobjects_path], app.admins || [], req.headers.locale,
      );
      break;
  }
  next();
};

/**
 * Get app name from request headers and find app with specified name in database
 * @param {Object} req instance of current request
 * @returns {Object} app, error
 */
const getApp = async (req) => {
  const appName = _.get(req, 'headers.app');

  if (!appName) {
    return {};
  }
  return App.getOne({ name: appName });
};

const newValidationArray = async (posts, admins, locale, path) => {
  await Promise.all(posts.map(async (post) => {
    if (post[path]) {
      post[path] = await wobjectHelper.processWobjects({
        wobjects: post[path],
        admins,
        hiveData: false,
        returnArray: true,
        locale,
        fields: REQUIREDFIELDS_POST,
      });
    }
  }));
  return posts;
};

const newValidation = async (wobjects, admins, locale) => wobjectHelper.processWobjects({
  wobjects, admins, hiveData: false, returnArray: true, locale,
});
