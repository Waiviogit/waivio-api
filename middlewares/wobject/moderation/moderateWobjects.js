const _ = require('lodash');
const { getNamespace } = require('cls-hooked');
const { schema } = require('middlewares/wobject/moderation/schema');
const { App } = require('models');
const wobjectHelper = require('utilities/helpers/wObjectHelper');
const { REQUIREDFILDS_WOBJ_LIST } = require('constants/wobjectsData');
const config = require('config');
const { getIpFromHeaders, getCountryCodeFromIp } = require('utilities/helpers/sitesHelper');
const { processAppAffiliate } = require('utilities/operations/affiliateProgram/processAffiliate');

exports.moderate = async (req, res, next) => {
  /*
    First need to find app of current request, then correct scheme of
    location wobjects data in response, and then moderate it if need

    data locate on "res.result" => {status, json}
    app locate on "res.headers.app"
    */

  const currentSchema = schema.find((s) => s.path === _.get(req, 'route.path') && s.method === req.method);

  if (!currentSchema) {
    next();
    return;
  }

  const { result: app, error: getAppErr } = await getApp();

  if (getAppErr || !app) {
    next();
    return;
  }

  const countryCode = await getCountryCodeFromIp(getIpFromHeaders(req));
  const reqUserName = _.get(req, 'headers.follower');
  const affiliateCodes = await processAppAffiliate({
    countryCode,
    app,
    locale: req.headers.locale,
  });

  switch (currentSchema.case) {
    case 1:
      // root result is single wobject
      const wobject = await wobjectHelper.processWobjects({
        wobjects: [res.result.json],
        app,
        hiveData: true,
        returnArray: false,
        locale: req.headers.locale,
        countryCode,
        reqUserName,
        affiliateCodes,
      });
      wobject.updatesCount = _.sumBy(wobject.exposedFields, 'value');
      res.result.json = _.omit(wobject, ['fields']);
      break;
    case 2:
      res.result.json = await newValidation({
        wobjects: res.result.json,
        app,
        locale: req.headers.locale,
        countryCode,
        reqUserName,
        affiliateCodes,
      });
      break;
    case 4:
      res.result.json = await newValidationArray({
        posts: res.result.json,
        app,
        locale: req.headers.locale,
        path: currentSchema.wobjects_path,
        countryCode,
        reqUserName,
        affiliateCodes,
      });
      break;
    case 6:
      res.result.json[currentSchema.wobjects_path] = await newValidation({
        wobjects: res.result.json[currentSchema.wobjects_path],
        app,
        locale: req.headers.locale,
        countryCode,
        reqUserName,
        affiliateCodes,
      });
      break;
    case 7:
      res.result.json[currentSchema.array_path] = await newValidationArray({
        posts: res.result.json[currentSchema.array_path],
        app,
        locale: req.headers.locale,
        path: currentSchema.wobjects_path,
        countryCode,
        reqUserName,
        affiliateCodes,
      });
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
  let host = session.get('host');
  if (!host) {
    host = config.appHost;
  }
  return App.findOne({ host });
};

const newValidationArray = async ({
  posts, app, locale, path, countryCode, reqUserName, affiliateCodes,
}) => {
  await Promise.all(posts.map(async (post) => {
    if (post[path]) {
      post[path] = await wobjectHelper.processWobjects({
        wobjects: post[path],
        app,
        hiveData: false,
        returnArray: true,
        locale,
        fields: REQUIREDFILDS_WOBJ_LIST,
        countryCode,
        reqUserName,
        affiliateCodes,
      });
    }
  }));
  return posts;
};

const newValidation = async ({
  wobjects, app, locale, countryCode, reqUserName, affiliateCodes,
}) => wobjectHelper.processWobjects({
  wobjects, app, hiveData: false, returnArray: true, locale, fields: REQUIREDFILDS_WOBJ_LIST, countryCode, reqUserName, affiliateCodes,
});
