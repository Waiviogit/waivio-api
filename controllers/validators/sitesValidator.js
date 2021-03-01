const Joi = require('@hapi/joi');
const { SITE_NAME_REGEX } = require('constants/sitesConstants');

const options = { allowUnknown: true, stripUnknown: true };

exports.availableCheck = Joi.object().keys({
  name: Joi.string().pattern(SITE_NAME_REGEX).invalid('www').min(1)
    .required(),
  parentId: Joi.string().required(),
}).options(options);

exports.getApps = Joi.object().keys({
  userName: Joi.string().required(),
}).options(options);

exports.createApp = Joi.object().keys({
  owner: Joi.string().required(),
  name: Joi.string().regex(/[a-z,0-9]+$\b/).required(),
  parentId: Joi.string().required(),
}).options(options);

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
        Joi.number().min(-180).max(180),
        Joi.number().min(-90).max(90),
      ).required(),
    bottomPoint: Joi
      .array()
      .ordered(
        Joi.number().min(-180).max(180),
        Joi.number().min(-90).max(90),
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
