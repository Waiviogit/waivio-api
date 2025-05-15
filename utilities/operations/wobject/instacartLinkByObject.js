const { OBJECT_TYPES, FIELDS_NAMES } = require('@waivio/objects-processor');
const Joi = require('joi');
const { redis, redisGetter, redisSetter } = require('../../redis');
const { Wobj } = require('../../../models');
const {
  REDIS_KEYS,
  TTL_TIME,
} = require('../../../constants/common');
const { wObjectHelper, jsonHelper } = require('../../helpers');

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

const getInstacartLinkByObject = async ({ app, authorPermlink }) => {
  if (!app.host) return { error: { status: 422, message: 'App not found' } };
  const key = `${REDIS_KEYS.INSTACART_LINKS}:${app.host}:${authorPermlink}`;
  const { result: link } = await redisGetter.getAsync({ key, client: redis.mainFeedsCacheClient });
  if (link) return { result: link };

  const { wObject, error } = await Wobj.getOne(authorPermlink, OBJECT_TYPES.RECIPE);
  if (error) return { error };

  const processed = await wObjectHelper.processWobjects({
    fields: [
      FIELDS_NAMES.DESCRIPTION,
      FIELDS_NAMES.AVATAR,
      FIELDS_NAMES.RECIPE_INGREDIENTS,
      FIELDS_NAMES.NAME,
    ],
    wobjects: [wObject],
    app,
    returnArray: false,
  });

  const payload = {
    title: processed.name,
    image_url: processed.avatar,
    link_type: 'recipe',
    ingredients: jsonHelper.parseJson(processed.recipeIngredients).map((el) => ({ name: el })),
    instructions: processed.description.split('\n'),
  };
  const { value, error: validationError } = instacartPayloadSchema.validate(payload);

  if (validationError) return { error: { status: 422, message: error.message } };

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

  return { result: result.products_link_url };
};

module.exports = {
  getInstacartLinkByObject,
};
