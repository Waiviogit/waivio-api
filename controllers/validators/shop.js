const Joi = require('joi');
const { SHOP_DEPARTMENTS_TYPE } = require('constants/shop');

const options = { stripUnknown: true, convert: true };

exports.departmentsSchema = Joi.object().keys({
  name: Joi.string(),
  excluded: Joi.array().items(Joi.string()),
}).options(options);

exports.mainFiltersSchema = Joi.object().keys({
  path: Joi.array().items(Joi.string()),
});

exports.tagsSchema = Joi.object().keys({
  tagCategory: Joi.string().required(),
  skip: Joi.number().default(0),
  limit: Joi.number().default(10),
  path: Joi.array().items(Joi.string()),
}).options(options);

exports.userDepartmentsSchema = Joi.object().keys({
  userName: Joi.string().required(),
  name: Joi.string(),
  excluded: Joi.array().items(Joi.string()),
}).options(options);

exports.userFiltersSchema = Joi.object().keys({
  userName: Joi.string().required(),
  path: Joi.array().items(Joi.string()),
}).options(options);

exports.userTagsSchema = Joi.object().keys({
  userName: Joi.string().required(),
  tagCategory: Joi.string().required(),
  skip: Joi.number().default(0),
  limit: Joi.number().default(10),
  path: Joi.array().items(Joi.string()),
}).options(options);

exports.wobjectDepartmentsSchema = Joi.object().keys({
  authorPermlink: Joi.string().required(),
  name: Joi.string(),
  excluded: Joi.array().items(Joi.string()),
}).options(options);

exports.mainFeedSchema = Joi.object().keys({
  userName: Joi.string(),
  locale: Joi.string().default('en-US'),
  department: Joi.string(),
  excludedDepartments: Joi.array().items(Joi.string()),
  filter: Joi.object().keys({
    rating: Joi.number().min(0).max(10),
    tagCategory: Joi.array().items(Joi.object().keys({
      categoryName: Joi.string(),
      tags: Joi.array().items(Joi.string()),
    })),
  }),
  path: Joi.array().items(Joi.string()),
  skip: Joi.number().default(0),
  limit: Joi.number().default(5),
}).options(options);

exports.departmentFeedSchema = Joi.object().keys({
  department: Joi.string().required(),
  userName: Joi.string(),
  locale: Joi.string().default('en-US'),
  filter: Joi.object().keys({
    rating: Joi.number().min(0).max(10),
    tagCategory: Joi.array().items(Joi.object().keys({
      categoryName: Joi.string(),
      tags: Joi.array().items(Joi.string()),
    })),
  }),
  skip: Joi.number().default(0),
  limit: Joi.number().default(10),
  path: Joi.array().items(Joi.string()).required(),
}).options(options);

exports.userFeedSchema = Joi.object().keys({
  userName: Joi.required(),
  department: Joi.string(),
  excludedDepartments: Joi.array().items(Joi.string()),
  locale: Joi.string().default('en-US'),
  follower: Joi.string(),
  filter: Joi.object().keys({
    rating: Joi.number().min(0).max(10),
    tagCategory: Joi.array().items(Joi.object().keys({
      categoryName: Joi.string(),
      tags: Joi.array().items(Joi.string()),
    })),
  }),
  path: Joi.array().items(Joi.string()),
  skip: Joi.number().default(0),
  limit: Joi.number().default(5),
}).options(options);

exports.userFeedDepartmentsSchema = Joi.object().keys({
  department: Joi.string().required(),
  userName: Joi.string().required(),
  follower: Joi.string(),
  locale: Joi.string().default('en-US'),
  filter: Joi.object().keys({
    rating: Joi.number().min(0).max(10),
    tagCategory: Joi.array().items(Joi.object().keys({
      categoryName: Joi.string(),
      tags: Joi.array().items(Joi.string()),
    })),
  }),
  skip: Joi.number().default(0),
  limit: Joi.number().default(10),
  path: Joi.array().items(Joi.string()).required(),
}).options(options);

exports.wobjectFeedSchema = Joi.object().keys({
  authorPermlink: Joi.string().required(),
  department: Joi.string(),
  excludedDepartments: Joi.array().items(Joi.string()),
  locale: Joi.string().default('en-US'),
  follower: Joi.string(),
  path: Joi.array().items(Joi.string()),
  skip: Joi.number().default(0),
  limit: Joi.number().default(5),
  filter: Joi.object().keys({
    rating: Joi.number().min(0).max(10),
    tagCategory: Joi.array().items(Joi.object().keys({
      categoryName: Joi.string(),
      tags: Joi.array().items(Joi.string()),
    })),
  }),
}).options(options);

exports.wobjectFeedDepartmentsSchema = Joi.object().keys({
  department: Joi.string().required(),
  authorPermlink: Joi.string().required(),
  follower: Joi.string(),
  locale: Joi.string().default('en-US'),
  skip: Joi.number().default(0),
  limit: Joi.number().default(10),
  path: Joi.array().items(Joi.string()).required(),
  filter: Joi.object().keys({
    rating: Joi.number().min(0).max(10),
    tagCategory: Joi.array().items(Joi.object().keys({
      categoryName: Joi.string(),
      tags: Joi.array().items(Joi.string()),
    })),
  }),
}).options(options);

exports.wobjectFiltersSchema = Joi.object().keys({
  authorPermlink: Joi.string().required(),
  path: Joi.array().items(Joi.string()),
}).options(options);

exports.wobjectTagsSchema = Joi.object().keys({
  authorPermlink: Joi.string().required(),
  tagCategory: Joi.string().required(),
  skip: Joi.number().default(0),
  limit: Joi.number().default(10),
  path: Joi.array().items(Joi.string()),
}).options(options);

exports.restoreShopSchema = Joi.object().keys({
  authorPermlink: Joi.string(),
  userName: Joi.string(),
  path: Joi.array().items(Joi.string()).required(),
  type: Joi.string().valid(...Object.values(SHOP_DEPARTMENTS_TYPE))
    .default(SHOP_DEPARTMENTS_TYPE.MAIN),
}).options(options);
