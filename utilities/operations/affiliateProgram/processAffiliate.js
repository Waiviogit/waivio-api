const { Wobj } = require('models');
const Joi = require('joi');
const {
  OBJECT_TYPES, FIELDS_NAMES, AFFILIATE_FIELDS, REMOVE_OBJ_STATUSES,
} = require('constants/wobjectsData');
const {
  COUNTRY_TO_CONTINENT, GLOBAL_GEOGRAPHY, WAIVIO_AFFILIATE_HOSTS,
} = require('constants/affiliateData');
const wObjectHelper = require('utilities/helpers/wObjectHelper');
const jsonHelper = require('utilities/helpers/jsonHelper');
const _ = require('lodash');

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

const chooseOneFromSimilar = ({ similar, countryCode }) => {
  const continent = COUNTRY_TO_CONTINENT[countryCode];

  const country = similar.find((el) => el.affiliateGeoArea.includes(countryCode));
  const continentObj = similar.find((el) => el.affiliateGeoArea.includes(continent));
  const global = similar.find((el) => el.affiliateGeoArea.includes(GLOBAL_GEOGRAPHY));

  return country || continentObj || global;
};

const filterByIdType = ({ objects, countryCode }) => {
  const filtered = [];
  const alreadyUsed = [];

  for (const object of objects) {
    if (alreadyUsed.some((el) => _.isEqual(el, object))) continue;
    const similar = objects.filter(
      (el) => el.affiliateProductIdTypes.some((t) => object.affiliateProductIdTypes.includes(t)),
    );
    const filteredEl = chooseOneFromSimilar({ similar, countryCode });

    if (!filteredEl) continue;
    filtered.push(filteredEl);
    alreadyUsed.push(...similar);
  }

  return filtered;
};

const makeFilterAppCondition = (app) => {
  const regex = `\\["${app.host.replace(/\./g, '\\.')}`;

  return {
    object_type: OBJECT_TYPES.AFFILIATE,
    'status.title': { $nin: REMOVE_OBJ_STATUSES },
    fields: {
      $elemMatch: {
        name: FIELDS_NAMES.AFFILIATE_CODE,
        body: { $regex: regex },
      },
    },
    ...(WAIVIO_AFFILIATE_HOSTS.includes(app.host) && { 'authority.ownership': { $in: app.authority } }),
  };
};

const makeFilterUserCondition = ({ app, creator }) => {
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
        body: { $regex: appRegex },
      },
    },
  };
};

const processObjectsToAffiliateArray = async ({
  wobjects, app, locale, countryCode,
}) => {
  const processed = await wObjectHelper.processWobjects({
    wobjects,
    app,
    locale,
    fields: AFFILIATE_FIELDS,
  });

  const validObjects = filterAffiliateObjects(processed);

  const parsedValidAffiliates = parseAffiliateFields(validObjects);

  return filterByIdType({ objects: parsedValidAffiliates, countryCode });
};

const processUserAffiliate = async ({
  countryCode = 'US', app, locale = 'en-US', creator,
}) => {
  const { result, error } = await Wobj.findObjects({
    filter: makeFilterUserCondition({ app, creator }),
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
        return el.creator === creator && el.body.includes(app.host);
      });
    }
  }

  return processObjectsToAffiliateArray({
    wobjects: result, app, locale, countryCode,
  });
};

const processAppAffiliate = async ({ countryCode = 'US', app, locale = 'en-US' }) => {
  const { result, error } = await Wobj.findObjects({
    filter: makeFilterAppCondition(app),
  });

  if (!WAIVIO_AFFILIATE_HOSTS.includes(app.host)) {
    for (const resultElement of result) {
      if (resultElement?.authority?.ownership) {
        resultElement.authority.ownership = [];
      }

      resultElement.fields = resultElement.fields.filter((el) => {
        if (el.name !== FIELDS_NAMES.AFFILIATE_CODE) return true;
        return el.creator === app.owner && el.body.includes(app.host);
      });
    }
  }

  if (error) return [];

  return processObjectsToAffiliateArray({
    wobjects: result, app, locale, countryCode,
  });
};

module.exports = {
  processAppAffiliate,
  processUserAffiliate,
};
