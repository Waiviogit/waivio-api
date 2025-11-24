const { Wobj } = require('../../../models');
const { getAppAuthorities } = require('../../helpers/appHelper');
const { staleWhileRevalidate } = require('../../helpers/cacheHelper');

const sortAlphabetically = (arr) => arr.slice().sort((a, b) => a.localeCompare(b));

const buildCategoryMap = (result) => {
  const myMap = new Map();
  for (const resultElement of result) {
    for (const category of resultElement.tagCategories) {
      const values = myMap.get(category);
      if (values) myMap.set(category, [...values, resultElement._id]);
      else myMap.set(category, [resultElement._id]);
    }
  }
  return myMap;
};

const HOUR_IN_SECONDS = 60 * 60;
const CACHE_NAMESPACE = {
  CATEGORIES: 'tagsFilter:categories',
  CATEGORY_TAGS: 'tagsFilter:categoryTags',
};

const getAppHost = (app) => app?.host || 'global';

const buildCategoriesCacheKey = ({ app, objectType }) => (
  `${CACHE_NAMESPACE.CATEGORIES}:${getAppHost(app)}:${objectType}`
);

const buildCategoryTagsCacheKey = ({
  app,
  objectType,
  tagCategory,
}) => (
  `${CACHE_NAMESPACE.CATEGORY_TAGS}:${getAppHost(app)}:${objectType}:${tagCategory}`
);

const fetchCategoriesPayload = async ({ app, objectType }) => {
  const { wobjects: result, error } = await Wobj.fromAggregation([
    {
      $match: {
        'authority.administrative': { $in: getAppAuthorities(app) },
        object_type: objectType,
      },
    }, {
      $unwind: {
        path: '$fields',
      },
    }, {
      $match: {
        'fields.name': 'categoryItem',
      },
    }, {
      $group: {
        _id: '$fields.body',
        tagCategories: {
          $addToSet: '$fields.tagCategory',
        },
      },
    },
  ]);
  if (error) return { error };

  const myMap = buildCategoryMap(result);
  return {
    result: Array.from(
      myMap,
      ([tagCategory, tags]) => ({
        tagCategory,
        tags: sortAlphabetically(tags),
      }),
    ),
  };
};

const fetchCategoryTagsPayload = async ({
  app,
  objectType,
  tagCategory,
}) => {
  const { wobjects: result, error } = await Wobj.fromAggregation([
    {
      $match: {
        'authority.administrative': { $in: getAppAuthorities(app) },
        object_type: objectType,
      },
    }, {
      $unwind: {
        path: '$fields',
      },
    }, {
      $match: {
        'fields.name': 'categoryItem',
        'fields.tagCategory': tagCategory,
      },
    }, {
      $group: {
        _id: '$fields.body',
      },
    },
  ]);
  if (error) return { error };

  return {
    result: {
      tagCategory,
      tags: sortAlphabetically(result.map((item) => item._id)),
    },
  };
};

const getCategoriesByObjectType = async ({ app, objectType, tagsLimit = 3 }) => {
  const cacheKey = buildCategoriesCacheKey({ app, objectType });
  const basePayload = await staleWhileRevalidate({
    key: cacheKey,
    ttlSeconds: HOUR_IN_SECONDS,
    fetcher: () => fetchCategoriesPayload({ app, objectType }),
  });

  if (basePayload?.error) return basePayload;
  if (!basePayload?.result) return { result: [] };

  return {
    result: basePayload.result.map(({ tagCategory, tags }) => ({
      tagCategory,
      tags: tags.slice(0, tagsLimit),
      hasMore: tags.length > tagsLimit,
    })),
  };
};

const getCategoryTagsByObjectType = async ({
  app,
  objectType,
  tagCategory,
  skip = 0,
  limit = 10,
}) => {
  const cacheKey = buildCategoryTagsCacheKey({ app, objectType, tagCategory });
  const basePayload = await staleWhileRevalidate({
    key: cacheKey,
    ttlSeconds: HOUR_IN_SECONDS,
    fetcher: () => fetchCategoryTagsPayload({ app, objectType, tagCategory }),
  });

  if (basePayload?.error) return basePayload;
  if (!basePayload?.result?.tags) {
    return {
      result: {
        tagCategory,
        tags: [],
        hasMore: false,
      },
    };
  }

  const pagedTags = basePayload.result.tags.slice(skip, skip + limit);
  return {
    result: {
      tagCategory,
      tags: pagedTags,
      hasMore: basePayload.result.tags.length > skip + limit,
    },
  };
};

module.exports = { getCategoriesByObjectType, getCategoryTagsByObjectType };
