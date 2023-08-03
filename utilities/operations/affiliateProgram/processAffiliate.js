const { Wobj } = require('models');
const Joi = require('joi');
const {
  OBJECT_TYPES, FIELDS_NAMES, AFFILIATE_FIELDS, REMOVE_OBJ_STATUSES,
} = require('constants/wobjectsData');
const {
  WAIVIO_AFFILIATE_HOSTS,
} = require('constants/affiliateData');
const wObjectHelper = require('utilities/helpers/wObjectHelper');
const jsonHelper = require('utilities/helpers/jsonHelper');
const _ = require('lodash');
const config = require('config');

const affiliateScheme = Joi.object().keys({
  affiliateButton: Joi.string().required(),
  affiliateProductIdTypes: Joi.array().items(Joi.string()).min(1).required(),
  affiliateGeoArea: Joi.array().items(Joi.string()).min(1).required(),
  affiliateUrlTemplate: Joi.string().required(),
  affiliateCode: Joi.string().required(),
}).options({ allowUnknown: true });

const filterAffiliateObjects = (objects) => objects.filter((el) => {
  const { error } = affiliateScheme.validate(el);
  return !error;
});

const parseAffiliateFields = (objects) => objects.reduce((acc, el) => {
  const {
    affiliateButton,
    affiliateProductIdTypes,
    affiliateGeoArea,
    affiliateUrlTemplate,
    affiliateCode,
  } = el;
  const parsedCode = jsonHelper.parseJson(affiliateCode, null);
  if (!parsedCode) return acc;
  acc.push({
    affiliateButton,
    affiliateUrlTemplate,
    affiliateCode: parsedCode,
    affiliateGeoArea,
    affiliateProductIdTypes,
  });

  return acc;
}, []);

const makeFilterAppCondition = (app) => {
  const regex = app
    ? `\\["${app.host.replace(/\./g, '\\.')}`
    : `\\["${config.appHost.replace(/\./g, '\\.')}`;

  const match = {
    object_type: OBJECT_TYPES.AFFILIATE,
    'status.title': { $nin: REMOVE_OBJ_STATUSES },
    fields: {
      $elemMatch: {
        name: FIELDS_NAMES.AFFILIATE_CODE,
        body: { $regex: regex },
      },
    },
    ...(WAIVIO_AFFILIATE_HOSTS.includes(app?.host) && { 'authority.ownership': { $in: app?.authority } }),
  };

  return [
    { $match: match },
    {
      $addFields: {
        fields: {
          $let: {
            vars: {
              filteredFields: {
                $filter: {
                  input: '$fields',
                  as: 'field',
                  cond: {
                    $or: [
                      { $ne: ['$$field.name', 'affiliateCode'] },
                      { $regexMatch: { input: '$$field.body', regex } },
                    ],
                  },
                },
              },
            },
            in: '$$filteredFields',
          },
        },
      },
    },
  ];
};

const makeFilterUserCondition = ({ app, creator, usePersonal = false }) => {
  const regex = '\\["PERSONAL';
  const appRegex = `\\["${app.host.replace(/\./g, '\\.')}`;
  if (WAIVIO_AFFILIATE_HOSTS.includes(app.host)) {
    return {
      object_type: OBJECT_TYPES.AFFILIATE,
      'status.title': { $nin: REMOVE_OBJ_STATUSES },
      fields: {
        $elemMatch: {
          name: FIELDS_NAMES.AFFILIATE_CODE,
          body: { $regex: regex },
          creator,
        },
      },
    };
  }
  return {
    object_type: OBJECT_TYPES.AFFILIATE,
    'status.title': { $nin: REMOVE_OBJ_STATUSES },
    fields: {
      $elemMatch: {
        name: FIELDS_NAMES.AFFILIATE_CODE,
        body: { $regex: usePersonal ? regex : appRegex },
        ...(usePersonal && { creator }),
      },
    },
  };
};

const processObjectsToAffiliateArray = async ({
  wobjects, app, locale,
}) => {
  const processed = await wObjectHelper.processWobjects({
    wobjects,
    app,
    locale,
    fields: AFFILIATE_FIELDS,
  });

  const validObjects = filterAffiliateObjects(processed);

  return parseAffiliateFields(validObjects);
};

const processUserAffiliate = async ({
  app, locale = 'en-US', creator, usePersonal,
}) => {
  const { result, error } = await Wobj.findObjects({
    filter: makeFilterUserCondition({ app, creator, usePersonal }),
  });
  if (error) return [];

  if (WAIVIO_AFFILIATE_HOSTS.includes(app.host)) {
    for (const resultElement of result) {
      if (resultElement?.authority?.ownership) {
        resultElement.authority.ownership = [];
      }

      resultElement.fields = resultElement.fields.filter((el) => {
        if (el.name !== FIELDS_NAMES.AFFILIATE_CODE) return true;
        return el.creator === creator && el.body.includes('PERSONAL');
      });
    }
  } else {
    for (const resultElement of result) {
      if (resultElement?.authority?.ownership) {
        resultElement.authority.ownership = [];
      }

      resultElement.fields = resultElement.fields.filter((el) => {
        if (el.name !== FIELDS_NAMES.AFFILIATE_CODE) return true;
        return el.creator === creator && (usePersonal ? el.body.includes('PERSONAL') : el.body.includes(app.host));
      });
    }
  }

  return processObjectsToAffiliateArray({
    wobjects: result, app, locale,
  });
};

const processAppAffiliate = async ({ app, locale = 'en-US' }) => {
  const { wobjects: result, error } = await Wobj.fromAggregation(
    makeFilterAppCondition(app),
  );

  if (error && app?.owner && !WAIVIO_AFFILIATE_HOSTS.includes(app?.host)) {
    // return user personal codes if the site doesn't have its own
    return processUserAffiliate({
      app,
      locale,
      creator: app?.owner,
      usePersonal: true,
    });
  }

  if (error) return [];

  if (!WAIVIO_AFFILIATE_HOSTS.includes(app?.host)) {
    for (const resultElement of result) {
      if (resultElement?.authority?.ownership) {
        resultElement.authority.ownership = [];
      }

      resultElement.fields = resultElement.fields.filter((el) => {
        if (el.name !== FIELDS_NAMES.AFFILIATE_CODE) return true;
        return el.creator === app?.owner && el.body.includes(app?.host);
      });
    }
  }

  return processObjectsToAffiliateArray({
    wobjects: result, app, locale,
  });
};

module.exports = {
  processAppAffiliate,
  processUserAffiliate,
};
