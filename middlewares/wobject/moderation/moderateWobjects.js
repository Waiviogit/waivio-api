const _ = require('lodash');
const { getNamespace } = require('cls-hooked');
const { schema } = require('middlewares/wobject/moderation/schema');
const { App } = require('models');
const wobjectHelper = require('utilities/helpers/wObjectHelper');
const { REQUIREDFILDS_WOBJ_LIST } = require('constants/wobjectsData');

exports.moderate = async (req, res, next) => {
    /*
    First need to find app of current request, then correct scheme of
    location wobjects data in response, and then moderate it if need

    data locate on "res.result" => {status, json}
    app locate on "res.headers.app"
    */
  const { result: app, error: getAppErr } = await getApp();

  if (getAppErr || !app) {
    next();
    return;
  }
  const currentSchema = schema.find((s) => s.path === _.get(req, 'route.path') && s.method === req.method);

  if (!currentSchema) {
    next();
    return;
  }
  switch (currentSchema.case) {
    case 1:
      // root result is single wobject
      res.result.json = await wobjectHelper.processWobjects({
        wobjects: [res.result.json],
        app,
        hiveData: true,
        returnArray: false,
        locale: req.headers.locale,
      });
      break;
    case 2:
      res.result.json = await newValidation(res.result.json, app, req.headers.locale);
      break;
    case 4:
      res.result.json = await newValidationArray(res.result.json, app, req.headers.locale, currentSchema.wobjects_path);
      break;
    case 6:
      res.result.json[currentSchema.wobjects_path] = await newValidation(
        res.result.json[currentSchema.wobjects_path], app, req.headers.locale,
      );
      break;
    case 7:
      res.result.json[currentSchema.array_path] = await newValidationArray(
        res.result.json[currentSchema.array_path], app, req.headers.locale, currentSchema.wobjects_path,
      );
      break;
    case 8:
      res.result.json.posts = await newValidationArray(res.result.json.posts, app, req.headers.locale, currentSchema.wobjects_path);
      break;
  }
  next();
};

/**
 * Get app name from request headers and find app with specified name in database
 * @param {Object} req instance of current request
 * @returns {Object} app, error
 */
const getApp = async () => {
  const session = getNamespace('request-session');
  const host = session.get('host');
  if (!host) {
    return {};
  }
  return App.findOne({ host });
};

const newValidationArray = async (posts, app, locale, path) => {
  await Promise.all(posts.map(async (post) => {
    if (post[path]) {
      post[path] = await wobjectHelper.processWobjects({
        wobjects: post[path],
        app,
        hiveData: false,
        returnArray: true,
        locale,
        fields: REQUIREDFILDS_WOBJ_LIST,
      });
    }
  }));
  return posts;
};

const newValidation = async (wobjects, app, locale) => wobjectHelper.processWobjects({
  wobjects, app, hiveData: false, returnArray: true, locale, fields: REQUIREDFILDS_WOBJ_LIST,
});
