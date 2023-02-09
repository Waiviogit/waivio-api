const { FOLLOWERS_SORT, VALID_FOLLOWERS_SORT, SEARCH_SORT } = require('constants/sortData');
const { EXPERTS_SORT, VALID_EXPERTS_SORT, FIELDS_SORT } = require('constants/sortData');
const { customValidationHelper } = require('utilities/helpers');
const { OBJECT_TYPES } = require('constants/wobjectsData');
const { LANGUAGES } = require('constants/common');
const Joi = require('joi');

const options = { allowUnknown: true, stripUnknown: true };

const boxScheme = Joi.object().keys({
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
});

exports.showSchema = Joi.object().keys({
  author_permlink: Joi.string().required(),
  locale: Joi.string(),
  user: Joi.string(),
  appName: Joi.string(),
  listCounters: Joi.boolean().default(false),
});

exports.indexSchema = Joi.object().keys({
  limit: Joi.number().integer().min(1).max(500)
    .default(30),
  skip: Joi.number().integer().min(0).default(0),
  user_limit: Joi.number().integer().min(0).max(100)
    .default(5),
  locale: Joi.string().default('en-US'),
  author_permlinks: Joi.array().items(Joi.string()).default([]),
  object_types: Joi.array().items(Joi.string()).default([]),
  exclude_object_types: Joi.array().items(Joi.string()).default([]),
  required_fields: Joi.array().items(Joi.string()).default([]),
  sample: Joi.boolean(),
  map: Joi.object().keys({
    coordinates: Joi.array().ordered(
      Joi.number().min(-90).max(90),
      Joi.number().min(-180).max(180),
    ),
    radius: Joi.number().min(0),
  }),
});

exports.postsScheme = Joi.object().keys({
  author_permlink: Joi.string().required(),
  limit: Joi.number().integer().min(1).max(100)
    .default(30),
  skip: Joi.number().integer().min(0).default(0),
  user_languages: Joi.array().items(Joi.string().valid(...LANGUAGES)).default(['en-US']),
  forApp: Joi.string(),
  lastId: Joi.string().custom(customValidationHelper.validateObjectId, 'Validate Mongoose ObjectId'),
  userName: Joi.string().default(''),
  newsPermlink: Joi.string().default(''),
});

exports.feedScheme = Joi.object().keys({
  limit: Joi.number().integer().min(1).max(100)
    .default(30),
  skip: Joi.number().integer().min(0).default(0),
  filter: Joi.object().keys({
    byApp: Joi.string(),
  }),
});

exports.followersScheme = Joi.object().keys({
  limit: Joi.number().integer().min(1).max(100)
    .default(30),
  skip: Joi.number().integer().min(0).default(0),
  author_permlink: Joi.string().required(),
  sort: Joi.string().valid(...VALID_FOLLOWERS_SORT).default(FOLLOWERS_SORT.RECENCY),
});

exports.searchScheme = Joi.object().keys({
  limit: Joi.number().integer().min(1).max(100)
    .default(10),
  skip: Joi.number().integer().min(0).default(0),
  tagCategory: Joi.array().items(Joi.object().keys({
    categoryName: Joi.string().required(),
    tags: Joi.array().items(Joi.string()).min(1).required(),
  })).min(1),
  userName: Joi.string(),
  sort: Joi.string().valid(...Object.values(SEARCH_SORT)).default(SEARCH_SORT.WEIGHT),
  map: Joi.object().keys({
    coordinates: Joi
      .array()
      .ordered(
        Joi.number().min(-180).max(180),
        Joi.number().min(-90).max(90),
      ),
    radius: Joi.number().min(0),
  }),
  simplified: Joi.boolean().default(false),
  string: Joi.string().allow(''),
  locale: Joi.string().default('en-US'),
  sortByApp: Joi.string().allow('').default(null),
  object_type: Joi.string(),
  forParent: Joi.string().invalid('').allow(null),
  required_fields: Joi.array().items(Joi.string()).default([]),
  box: boxScheme,
  addHashtag: Joi.boolean().default(false),
  mapMarkers: Joi.boolean().default(false),
}).options(options);

exports.galleryScheme = Joi.object().keys({
  authorPermlink: Joi.string().required(),
  locale: Joi.string().default('en-US'),
  app: Joi.string(),
});

exports.objectExpertiseScheme = Joi.object().keys({
  limit: Joi.number().integer().min(1).max(100)
    .default(5),
  skip: Joi.number().integer().min(0).default(0),
  sort: Joi.string().valid(...VALID_EXPERTS_SORT)
    .default(EXPERTS_SORT.RANK),
  author_permlink: Joi.string().required(),
  user: Joi.string().allow('').default(null),
  newsFilter: Joi.string().default(''),
});

exports.getByFieldScheme = Joi.object().keys({
  fieldName: Joi.string().required(),
  fieldBody: Joi.string().required(),
});

exports.getChildWobjects = Joi.object().keys({
  limit: Joi.number().integer().min(0).max(100)
    .default(30),
  skip: Joi.number().integer().min(0).default(0),
  authorPermlink: Joi.string().required(),
  excludeTypes: Joi.array().items(Joi.string()).default([]).single(),
  searchString: Joi.string().default(''),
  userName: Joi.string().default(''),
});

exports.getWobjectField = Joi.object().keys({
  authorPermlink: Joi.string().required(),
  author: Joi.string().required(),
  permlink: Joi.string().required(),
  fieldName: Joi.string().required(),
  locale: Joi.string().default('en-US'),
  app: Joi.string().required(),
});

exports.getWobjectsNearby = Joi.object().keys({
  authorPermlink: Joi.string().required(),
  skip: Joi.number().integer().min(0).default(0),
  limit: Joi.number().integer().min(1).max(100)
    .default(5),
  radius: Joi.number().integer().min(0).default(20000),
});

exports.countWobjectsByArea = Joi.object().keys({
  objectType: Joi.string().required(),
});

exports.getRelatedAlbum = Joi.object().keys({
  limit: Joi.number().integer().min(1).max(100)
    .default(30),
  skip: Joi.number().integer().min(0).default(0),
  authorPermlink: Joi.string().required(),
});

exports.mapExpertsScheme = Joi.object().keys({
  box: boxScheme,
  limit: Joi.number().integer().min(1).max(100)
    .default(30),
  skip: Joi.number().integer().min(0).default(0),
});

exports.mapLastPostScheme = Joi.object().keys({
  box: boxScheme,
  limit: Joi.number().integer().min(1).max(100)
    .default(30),
  skip: Joi.number().integer().min(0).default(0),
  objectType: Joi.string().valid(...Object.values(OBJECT_TYPES)).default(OBJECT_TYPES.RESTAURANT),
});

exports.byRequiredWobjectScheme = Joi.object().keys({
  limit: Joi.number().integer().min(1).max(100)
    .default(30),
  skip: Joi.number().integer().min(0).default(0),
  requiredObject: Joi.string().required(),
});

exports.authorPermlinkScheme = Joi.object().keys({
  authorPermlink: Joi.string().required(),
});

exports.getFieldsScheme = Joi.object().keys({
  authorPermlink: Joi.string().required(),
  limit: Joi.number().integer().min(1).default(10),
  skip: Joi.number().integer().min(0).default(0),
  type: Joi.string(),
  locale: Joi.string(),
  sort: Joi.string().valid(...Object.values(FIELDS_SORT)).default(FIELDS_SORT.CREATED),
});

exports.getNewsfeed = Joi.object().keys({
  author_permlink: Joi.string().required(),
  limit: Joi.number().integer().min(1).default(10),
  skip: Joi.number().integer().min(0).default(0),
  locale: Joi.string(),
  user_languages: Joi.array().items(Joi.string().valid(...LANGUAGES)).default(['en-US']),
  userName: Joi.string(),
  lastId: Joi.string().custom(customValidationHelper.validateObjectId, 'Validate Mongoose ObjectId'),
});

exports.wobjectsNamesScheme = Joi.object().keys({
  links: Joi.array().items(Joi.string()).required(),
});

exports.wobjectsOptionsScheme = Joi.object().keys({
  authorPermlink: Joi.string().required(),
  category: Joi.string().required(),
  limit: Joi.number().integer().min(1).default(10),
  skip: Joi.number().integer().min(0).default(0),
});
