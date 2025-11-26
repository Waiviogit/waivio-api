const { OBJECT_TYPES, FIELDS_NAMES } = require('@waivio/objects-processor');
const Joi = require('joi');
const { redis, redisGetter, redisSetter } = require('../../redis');
const { Wobj } = require('../../../models');
const {
  REDIS_KEYS,
  TTL_TIME,
} = require('../../../constants/common');
const { wObjectHelper, jsonHelper } = require('../../helpers');
const { processAppAffiliate } = require('../affiliateProgram/processAffiliate');
const { makeAffiliateLinks } = require('../affiliateProgram/makeAffiliateLinks');

const INSTACART_HOST = process.env.INSTACART_HOST || 'connect.dev.instacart.tools';
const { INSTACART_KEY } = process.env;

const instacartPayloadSchema = Joi.object().keys({
  title: Joi.string().required(),
  image_url: Joi.string(),
  link_type: Joi.string().required(),
  instructions: Joi.array().items(Joi.string()),
  ingredients: Joi.array()
    .items(Joi.object().keys({ name: Joi.string().required() }))
    .min(1)
    .required(),
});

const createRecipeInstacart = async (payload) => {
  const url = `https://${INSTACART_HOST}/idp/v1/products/recipe`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${INSTACART_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { result: data };
  } catch (error) {
    return { error };
  }
};

const getInstacartAffiliatePart = ({ affiliateLinks }) => {
  if (process.env.NODE_ENV !== 'production') return '';
  const partnerId = affiliateLinks.find((el) => el.type === 'instacart')?.affiliateCode;
  if (!partnerId) return '';

  return `?utm_campaign=instacart-idp&utm_medium=affiliate&utm_source=instacart_idp&utm_term=partnertype-mediapartner&utm_content=campaignid-20313_partnerid-${partnerId}`;
};

const getInstacartLinkByObject = async ({
  app, authorPermlink, locale, countryCode,
}) => {
  if (!app.host) return { error: { status: 422, message: 'App not found' } };
  const key = `${REDIS_KEYS.INSTACART_LINKS}:${authorPermlink}`;

  const { wObject, error } = await Wobj.getOne(authorPermlink, OBJECT_TYPES.RECIPE);
  if (error) return { error };

  const affiliateCodes = await processAppAffiliate({ app, locale });
  const processed = await wObjectHelper.processWobjects({
    fields: [
      FIELDS_NAMES.DESCRIPTION,
      FIELDS_NAMES.AVATAR,
      FIELDS_NAMES.RECIPE_INGREDIENTS,
      FIELDS_NAMES.NAME,
      FIELDS_NAMES.PRODUCT_ID,
    ],
    wobjects: [wObject],
    app,
    returnArray: false,
  });

  const affiliateLinks = makeAffiliateLinks({
    productIds: processed.productId,
    affiliateCodes,
    countryCode,
    objectType: processed.object_type,
  });

  const affiliatePart = getInstacartAffiliatePart({ affiliateLinks });

  const { result: link } = await redisGetter.getAsync({ key, client: redis.mainFeedsCacheClient });
  if (link) return { result: `${link}${affiliatePart}` };

  const payload = {
    title: processed.name,
    link_type: 'recipe',
    ingredients: jsonHelper.parseJson(processed.recipeIngredients).map((el) => ({ name: el })),
    ...(processed.avatar && { image_url: processed.avatar }),
    ...(processed.description && { instructions: [processed.description] }),
  };
  const { value, error: validationError } = instacartPayloadSchema.validate(payload);

  if (validationError) return { error: { status: 422, message: validationError.message } };

  const { result, error: createError } = await createRecipeInstacart(value);
  if (createError) return { error: createError };

  // result link will expire in 30 days by default
  const resultLink = result.products_link_url;
  await redisSetter.setEx({
    key,
    ttl: TTL_TIME.THIRTY_DAYS,
    value: resultLink,
    client: redis.mainFeedsCacheClient,
  });

  return { result: `${result.products_link_url}${affiliatePart}` };
};

module.exports = {
  getInstacartLinkByObject,
};
