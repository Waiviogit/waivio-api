const { Wobj } = require('models');
const Joi = require('joi');
const { OBJECT_TYPES, FIELDS_NAMES, AFFILIATE_FIELDS } = require('constants/wobjectsData');
const {
  COUNTRY_TO_CONTINENT, GLOBAL_GEOGRAPHY, WAIVIO_AFFILIATE_HOSTS, AFFILIATE_AUTHORITY,
} = require('constants/affiliateData');
const wObjectHelper = require('utilities/helpers/wObjectHelper');
const jsonHelper = require('utilities/helpers/jsonHelper');
const _ = require('lodash');

const affiliateScheme = Joi.object().keys({
  affiliateButton: Joi.string().required(),
  affiliateProductIdTypes: Joi.string().required(),
  affiliateGeoArea: Joi.string().required(),
  affiliateUrlTemplate: Joi.string().required(),
  affiliateCode: Joi.string().required(),
});

const filterAffiliateObjects = (objects) => objects.filter((el) => {
  const { error } = affiliateScheme.validate(el);
  return !!error;
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
  const parsedGeo = jsonHelper.parseJson(affiliateGeoArea, null);
  const parsedTypes = jsonHelper.parseJson(affiliateProductIdTypes, null);
  if (!parsedCode || !parsedGeo || !parsedTypes) return acc;
  acc.push({
    affiliateButton,
    affiliateUrlTemplate,
    affiliateCode: parsedCode,
    affiliateGeoArea: parsedGeo,
    affiliateProductIdTypes: parsedTypes,
  });

  return acc;
}, []);

const chooseOneFromSimilar = ({ similar, countryCode }) => {
  const continent = COUNTRY_TO_CONTINENT[countryCode];

  const affiliateObject = similar.find(
    (el) => el.affiliateGeoArea.includes(countryCode)
      || el.affiliateGeoArea.includes(continent)
      || el.affiliateGeoArea.includes(GLOBAL_GEOGRAPHY),
  );

  return affiliateObject;
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
    fields: {
      $elemMatch: {
        name: FIELDS_NAMES.AFFILIATE_CODE,
        body: { $regex: regex },
      },
    },
    ...(WAIVIO_AFFILIATE_HOSTS.includes(app.host) && { 'authority.ownership': AFFILIATE_AUTHORITY }),
  };
};

const makeFilterUserCondition = ({ app, creator }) => {
  const regex = '\\["PERSONAL';
  const appRegex = `\\["${app.host.replace(/\./g, '\\.')}`;
  if (WAIVIO_AFFILIATE_HOSTS.includes(app.host)) {
    return {
      object_type: OBJECT_TYPES.AFFILIATE,
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
      resultElement.fields = resultElement.fields.filter((el) => {
        if (el.name !== FIELDS_NAMES.AFFILIATE_CODE) return true;
        return el.creator === creator;
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

  if (error) return [];

  return processObjectsToAffiliateArray({
    wobjects: result, app, locale, countryCode,
  });
};

module.exports = {
  processAppAffiliate,
  processUserAffiliate,
};
