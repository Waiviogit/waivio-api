const _ = require('lodash');
const { App } = require('../../../models');
const wobjectHelper = require('../../../utilities/helpers/wObjectHelper');
const { REQUIREDFILDS_WOBJ_LIST } = require('../../../constants/wobjectsData');
const config = require('../../../config');
const { getIpFromHeaders, getCountryCodeFromIp } = require('../../../utilities/helpers/sitesHelper');
const { processAppAffiliate, processUserAffiliate } = require('../../../utilities/operations/affiliateProgram/processAffiliate');
const { WAIVIO_AFFILIATE_HOSTS } = require('../../../constants/affiliateData');
const { schema } = require('./schema');
const { isMobileDevice } = require('../../../middlewares/context/contextHelper');
const { makeAffiliateLinksOnList } = require('../../../utilities/operations/affiliateProgram/makeAffiliateLinks');

const newValidationArray = async ({
  posts, app, locale, path, countryCode, reqUserName, affiliateCodes,
}) => {
  await Promise.all(posts.map(async (post) => {
    if (post[path]) {
      post[path] = makeAffiliateLinksOnList({
        objects: await wobjectHelper.processWobjects({
          wobjects: post[path],
          app,
          hiveData: false,
          returnArray: true,
          locale,
          fields: REQUIREDFILDS_WOBJ_LIST,
          reqUserName,
          mobile: isMobileDevice(),
        }),
        countryCode,
        affiliateCodes,
      });
    }
  }));
  return posts;
};

const newValidation = async ({
  wobjects, app, locale, countryCode, reqUserName, affiliateCodes,
}) => makeAffiliateLinksOnList({
  objects: await wobjectHelper.processWobjects({
    wobjects,
    app,
    hiveData: false,
    returnArray: true,
    locale,
    fields: REQUIREDFILDS_WOBJ_LIST,
    countryCode,
    reqUserName,
    affiliateCodes,
    mobile: isMobileDevice(),
  }),
  affiliateCodes,
  countryCode,
});

const getAffiliateCodes = async ({ app, creator, affiliateCodes }) => {
  if (!WAIVIO_AFFILIATE_HOSTS.includes(app?.host)) {
    ({ result: app } = await App.findOne({ host: config.appHost }));
  }

  const userAffiliate = await processUserAffiliate({
    app,
    creator,
  });
  if (userAffiliate.length) return userAffiliate;

  return affiliateCodes;
};

const case2ObjectProcessor = async ({
  data, app, req, countryCode, reqUserName, affiliateCodes, currentSchema,
}) => newValidation({
  wobjects: data,
  app,
  locale: req.headers.locale,
  countryCode,
  reqUserName,
  affiliateCodes,
});
const case3ObjectProcessor = async ({
  data, app, req, countryCode, reqUserName, affiliateCodes, currentSchema,
}) => newValidationArray({
  posts: data,
  app,
  locale: req.headers.locale,
  path: currentSchema.wobjects_path,
  countryCode,
  reqUserName,
  affiliateCodes,
});
const case4ObjectProcessor = async ({
  data, app, req, countryCode, reqUserName, affiliateCodes, currentSchema,
}) => {
  if (_.get(req, 'route.path') === '/post/:author/:permlink') {
    const creator = data?.author;
    affiliateCodes = await getAffiliateCodes({ app, creator, affiliateCodes });
  }

  data[currentSchema.wobjects_path] = await newValidation({
    wobjects: data[currentSchema.wobjects_path],
    app,
    locale: req.headers.locale,
    countryCode,
    reqUserName,
    affiliateCodes,
  });

  return data;
};
const case5ObjectProcessor = async ({
  data, app, req, countryCode, reqUserName, affiliateCodes, currentSchema,
}) => {
  data[currentSchema.array_path] = await newValidationArray({
    posts: data[currentSchema.array_path],
    app,
    locale: req.headers.locale,
    path: currentSchema.wobjects_path,
    countryCode,
    reqUserName,
    affiliateCodes,
  });

  return data;
};

const defaultObjectProcessor = async ({ data }) => data;

const processors = {
  case2: case2ObjectProcessor,
  case3: case3ObjectProcessor,
  case4: case4ObjectProcessor,
  case5: case5ObjectProcessor,
  default: defaultObjectProcessor,
};

const context = (processorName) => async (data) => {
  const processor = processors[processorName] || processors.default;
  return processor(data);
};

const moderateObjects = async (data, req) => {
  if (!req.appData) return data;
  const currentSchema = schema.find((s) => s.path === _.get(req, 'route.path') && s.method === req.method);
  if (!currentSchema) return data;

  const countryCode = await getCountryCodeFromIp(getIpFromHeaders(req));
  const reqUserName = _.get(req, 'headers.follower');
  const affiliateCodes = await processAppAffiliate({
    app: req.appData,
    locale: req.headers.locale,
  });

  const handler = context(currentSchema.case);

  return handler({
    data, app: req.appData, req, countryCode, reqUserName, affiliateCodes, currentSchema,
  });
};

module.exports = moderateObjects;
