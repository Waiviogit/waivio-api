const { OBJECT_TYPES, FIELDS_NAMES } = require('@waivio/objects-processor');
const Joi = require('joi');
const { redis, redisGetter, redisSetter } = require('../../redis');
const { Wobj } = require('../../../models');
const {
  REDIS_KEYS,
  TTL_TIME,
} = require('../../../constants/common');
const { wObjectHelper, jsonHelper } = require('../../helpers');
const { promptWithJsonSchema } = require('../../openai/openaiClient');
const getWobjectPinnedPosts = require('./getWobjectPinnedPosts');
const getPostsByObject = require('./getPostsByWobject');

const INSTACART_HOST = process.env.INSTACART_HOST || 'connect.dev.instacart.tools';
const { INSTACART_KEY } = process.env;

const instacartPayloadSchema = Joi.object().keys({
  title: Joi.string().required(),
  image_url: Joi.string(),
  link_type: Joi.string().required(),
  instructions: Joi.array().items(Joi.string()),
  ingredients: Joi.array()
    .items(Joi.object().keys({
      name: Joi.string().required(),
      measurements: Joi.array().items(Joi.object().keys({
        quantity: Joi.number().required(),
        unit: Joi.string().required(),
      })),
    }))
    .min(1)
    .required(),
});

const instacartIngredientsSchema = {
  name: 'instacart_ingredients_schema',
  schema: {
    type: 'object',
    properties: {
      ingredients: {
        type: 'array',
        description: 'List of product ingredients.',
        items: {
          type: 'object',
          description: 'A single product ingredient.',
          properties: {
            name: {
              type: 'string',
              description: 'The product name. Instacart uses it as a search term.',
              minLength: 1,
            },
            measurements: {
              type: 'array',
              description: 'Measurement units used to specify the ingredient quantity in multiple ways.',
              items: {
                type: 'object',
                properties: {
                  quantity: {
                    type: 'number',
                    description: 'The product quantity. Represents item count or measurement based on the unit. Defaults to 1.0. must be gt than 0',
                  },
                  unit: {
                    type: 'string',
                    description: "The unit of measurement. Examples: each, package, tablespoon, teaspoon, ounce, kilogram. Defaults to 'each'.",
                  },
                },
              },
            },
          },
          required: ['name', 'measurements'],
        },
      },
      instructions: {
        type: 'array',
        description: 'preparation instructions',
        minLength: 1,
        items: {
          type: 'string',
          description: 'preparation step',
        },
      },
    },
    required: ['ingredients', 'instructions'],
  },
};

const getRecipeIngredients = async (object, preparation) => {
  if (process.env.NODE_ENV !== 'production') {
    return {
      ingredients: jsonHelper.parseJson(object.recipeIngredients).map((el) => ({ name: el })),
      instructions: [preparation],
    };
  }

  const prompt = `Based on recipe description and ingredients format ingredients according to schema;
  name: ${object.name}
  description: ${object.description}
  ingredients: ${object?.recipeIngredients}
  if ingredients says this amount or that amount in terms of quantity pick one with bigger quantity
  if description says use this ore that make each as ingredient pick both;
  
  Divide recipe preparation into steps: ${preparation}
  `;

  const { result, error } = await promptWithJsonSchema({
    prompt, jsonSchema: instacartIngredientsSchema,
  });

  if (error || !result.ingredients || !result.instructions) {
    return {
      ingredients: jsonHelper.parseJson(object.recipeIngredients).map((el) => ({ name: el })),
      instructions: [preparation],
    };
  }

  return result;
};

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
      // try to read JSON error first
      let errorBody;
      try {
        errorBody = await response.json();
      } catch (_) {
        errorBody = await response.text(); // fallback when response is not JSON
      }

      throw new Error(
        `HTTP ${response.status}: ${JSON.stringify(errorBody)}`,
      );
    }

    const data = await response.json();
    return { result: data };
  } catch (error) {
    return { error };
  }
};

const getRecipePreparationPost = async ({ authorPermlink, app }) => {
  const { posts = [] } = await getWobjectPinnedPosts({
    author_permlink: authorPermlink,
    app,
  });
  if (posts[0]) return posts[0]?.body;

  const { posts: feedPost } = await getPostsByObject({
    author_permlink: authorPermlink, app, skip: 0, limit: 1,
  });
  if (feedPost[0]) return feedPost[0]?.body;
  return '';
};

const generateTrackIds = (host) => {
  const uuid = crypto.randomUUID();
  return `&subId1=${uuid}&subId2=${host}`;
};

const getInstacartLinkByObject = async ({
  app, authorPermlink, locale, countryCode,
}) => {
  if (!app.host) return { error: { status: 422, message: 'App not found' } };
  const key = `${REDIS_KEYS.INSTACART_LINKS}:${authorPermlink}`;

  const { wObject, error } = await Wobj.getOne(authorPermlink, OBJECT_TYPES.RECIPE);
  if (error) return { error };

  const { result: link } = await redisGetter.getAsync({ key, client: redis.mainFeedsCacheClient });

  if (link) return { result: `${link}${generateTrackIds(app.host)}` };

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

  const preparationPost = await getRecipePreparationPost({ authorPermlink, app });
  const preparation = preparationPost || processed.description;
  const { ingredients, instructions } = await getRecipeIngredients(processed, preparation);

  const payload = {
    title: processed.name,
    link_type: 'recipe',
    ingredients,
    instructions,
    ...(processed.avatar && { image_url: processed.avatar }),
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

  return { result: `${result.products_link_url}${generateTrackIds(app.host)}` };
};

module.exports = {
  getInstacartLinkByObject,
};
