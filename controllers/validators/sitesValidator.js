const Joi = require('joi');
const { MAIN_OBJECT_TYPES, AFFILIATE_TYPE, COUNTRY_CODES } = require('../../constants/wobjectsData');
const { customJoi } = require('./customSchema');
const { SITE_NAME_REGEX, CATEGORY_ITEMS } = require('../../constants/sitesConstants');
const { SUPPORTED_CURRENCIES } = require('../../constants/common');

const options = { allowUnknown: true, stripUnknown: true };

exports.availableCheck = Joi.object().keys({
  name: Joi.string().pattern(SITE_NAME_REGEX).invalid('www').min(1),
  parentId: Joi.string().required(),
  host: Joi.string(),
}).or('host', 'name').options(options);

exports.checkNsSchema = Joi.object().keys({
  host: Joi.string(),
}).options(options);

exports.getApps = Joi.object().keys({
  userName: Joi.string().required(),
}).options(options);

exports.createApp = Joi.object().keys({
  owner: Joi.string().required(),
  name: Joi.string().regex(/[a-z,0-9]+$\b/),
  parentId: Joi.string().required(),
  host: Joi.string(),
}).or('name', 'host').options(options);

exports.managePage = Joi.object().keys({
  userName: Joi.string().required(),
}).options(options);

exports.report = Joi.object().keys({
  endDate: Joi.date().timestamp('unix').less('now'),
  startDate: Joi.when('endDate', {
    is: Joi.exist(),
    then: Joi.date().timestamp('unix').less(Joi.ref('endDate')),
    otherwise: Joi.date().timestamp('unix').less(new Date()),
  }),
  userName: Joi.string().required(),
  host: Joi.string(),
  currency: Joi.string().valid(...Object.values(SUPPORTED_CURRENCIES)),
}).options(options);

// eslint-disable-next-line no-multi-assign
exports.delete = exports.authorities = Joi.object().keys({
  userName: Joi.string().required(),
  host: Joi.string().required(),
}).options(options);

exports.searchTags = Joi.object().keys({
  string: Joi.string().lowercase().required(),
  category: Joi.string().required(),
}).options(options);

exports.mapData = Joi.object().keys({
  userName: Joi.string(),
  limit: Joi.number().default(20),
  skip: Joi.number().default(0),
  topPoint: Joi
    .array()
    .ordered(
      Joi.number().min(-180).max(180),
      Joi.number().min(-90).max(90),
    ).required(),
  bottomPoint: Joi
    .array()
    .ordered(
      Joi.number().min(-180).max(180),
      Joi.number().min(-90).max(90),
    ).required(),
}).options(options);

exports.siteMapCoordinates = Joi.object().keys({
  userName: Joi.string().required(),
  host: Joi.string().required(),
  mapCoordinates: Joi.array().items(Joi.object().keys({
    topPoint: Joi
      .array()
      .ordered(
        Joi.number().min(-180).max(180).required(),
        Joi.number().min(-90).max(90).required(),
      ).required(),
    bottomPoint: Joi
      .array()
      .ordered(
        Joi.number().min(-180).max(180).required(),
        Joi.number().min(-90).max(90).required(),
      ).required(),
    center: Joi.array().items(Joi.number()).required(),
    zoom: Joi.number().required(),
  })).max(30).required(),
});

exports.objectsFilter = Joi.object().keys({
  userName: Joi.string().required(),
  host: Joi.string().required(),
  objectsFilter: Joi.object().required(),
}).options({ allowUnknown: true });

exports.saveConfigurations = Joi.object().keys({
  userName: Joi.string().required(),
  host: Joi.string().required(),
  configuration: Joi.object().required(),
}).options({ allowUnknown: true });

exports.restrictions = Joi.object().keys({
  userName: Joi.string().required(),
  host: Joi.string().required(),
});

exports.showAllPrefetches = Joi.object().keys({
  types: customJoi.stringArray().items(Joi.string()).single().required(),
  skip: Joi.number().default(0),
  limit: Joi.number(),
});

exports.getPrefetchList = Joi.object().keys({
  types: customJoi.stringArray().items(Joi.string()).single().required(),
  skip: Joi.number().default(0),
  limit: Joi.number().default(30),
});

exports.createPrefetch = Joi.object().keys({
  name: Joi.string().required(),
  tag: Joi.string().required(),
  type: Joi.string().required().valid(...MAIN_OBJECT_TYPES),
  category: Joi.string().required().valid(...CATEGORY_ITEMS),
  image: Joi.string().uri(),
});

exports.updatePrefetchList = Joi.object().keys({
  userName: Joi.string().required(),
  names: Joi.array().items(Joi.string()).required(),
});

exports.getAffiliateList = Joi.object().keys({
  host: Joi.string().required(),
  userName: Joi.string().required(),
});

exports.updateAffiliateList = Joi.object().keys({
  host: Joi.string().required(),
  userName: Joi.string().required(),
  links: Joi.array()
    .items(Joi.object()
      .keys({
        host: Joi.string().required(),
        countryCode: Joi.string().required().valid(...Object.keys(COUNTRY_CODES)),
        type: Joi.string().required().valid(...Object.values(AFFILIATE_TYPE)),
        affiliateCode: Joi.string().allow('').required(),
      }))
    .required(),
});

exports.getAdSenseSchema = Joi.object().keys({
  host: Joi.string().required(),
});

exports.getParentHostSchema = Joi.object().keys({
  host: Joi.string().required(),
});

exports.updateAiSchema = Joi.object().keys({
  userName: Joi.string().required(),
  host: Joi.string().required(),
  key: Joi.string(),
});

exports.payPalBasicSchema = Joi.object().keys({
  host: Joi.string().required(),
  userName: Joi.string().required(),
});

exports.payPalActivateSchema = Joi.object().keys({
  host: Joi.string().required(),
  userName: Joi.string().required(),
  subscriptionId: Joi.string().required(),
});

exports.payPalSubCheckSchema = Joi.object().keys({
  host: Joi.string().required(),
});

exports.payPalCanselSubscriptionSchema = Joi.object().keys({
  host: Joi.string().required(),
  userName: Joi.string().required(),
  reason: Joi.string().min(1).max(128).required(),
});

exports.statisiticReportSchema = Joi.object().keys({
  host: Joi.string(),
  userName: Joi.string().required(),
  endDate: Joi.date().timestamp('unix').less('now'),
  startDate: Joi.when('endDate', {
    is: Joi.exist(),
    then: Joi.date().timestamp('unix').less(Joi.ref('endDate')),
    otherwise: Joi.date().timestamp('unix').less(new Date()),
  }),
  limit: Joi.number().min(0).default(20),
  skip: Joi.number().min(0).default(0),
});
