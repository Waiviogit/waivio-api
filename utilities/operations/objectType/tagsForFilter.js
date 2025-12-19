const { Wobj } = require('../../../models');
const { getAppAuthorities } = require('../../helpers/appHelper');
const { staleWhileRevalidate } = require('../../helpers/cacheHelper');
const { REMOVE_OBJ_STATUSES } = require('../../../constants/wobjectsData');

const sortAlphabetically = (arr) => arr.slice().sort((a, b) => a.localeCompare(b));
// eslint-disable-next-line no-useless-escape
const SEARCH_SANITIZE_REGEX = /[.,%?+*|{}\[\]()<>“”^'"\\\-_=!&$:]/g;

const sanitizeSearchString = (searchString) => (
  searchString ? searchString.replace(SEARCH_SANITIZE_REGEX, '').trim() : ''
);

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

const getSearchKeySuffix = (searchString) => (
  searchString ? `:search=${encodeURIComponent(searchString)}` : ''
);

const normalizeTagCategories = (tagCategories = []) => (
  tagCategories
    .filter((item) => item && item.categoryName && Array.isArray(item.tags) && item.tags.length)
    .map((item) => ({
      categoryName: item.categoryName,
      tags: item.tags
        .filter((tag) => typeof tag === 'string' && tag.trim())
        .map((tag) => tag.trim()),
    }))
);

const getSelectedTagCategoriesKeySuffix = (tagCategories) => {
  const normalized = normalizeTagCategories(tagCategories);
  if (!normalized.length) return '';

  const serialized = normalized
    .sort((a, b) => a.categoryName.localeCompare(b.categoryName))
    .map(({ categoryName, tags }) => `${encodeURIComponent(categoryName)}:${sortAlphabetically(tags).map(encodeURIComponent).join(',')}`)
    .join(';');

  return serialized ? `:tags=${serialized}` : '';
};

const buildCategoriesCacheKey = ({
  app, objectType, searchString, tagCategory,
}) => (
  `${CACHE_NAMESPACE.CATEGORIES}:${getAppHost(app)}:${objectType}${getSearchKeySuffix(searchString)}${getSelectedTagCategoriesKeySuffix(tagCategory)}`
);

const getSelectedTagsKeySuffix = (selectedTags) => (
  selectedTags?.length ? `:tags=${selectedTags.slice().sort().join(',')}` : ''
);

const buildCategoryTagsCacheKey = ({
  app,
  objectType,
  tagCategory,
  searchString,
  selectedTags,
}) => (
  `${CACHE_NAMESPACE.CATEGORY_TAGS}:${getAppHost(app)}:${objectType}:${tagCategory}${getSearchKeySuffix(searchString)}${getSelectedTagsKeySuffix(selectedTags)}`
);

const buildSearchMatchStage = (searchString) => {
  if (!searchString) return null;
  const normalized = sanitizeSearchString(searchString);
  if (!normalized) return null;

  return {
    $match: {
      $or: [
        { $text: { $search: `"${normalized}"` } },
        {
          author_permlink: {
            $regex: `${searchString?.[3] === '-' ? `^${searchString}` : '_'}`,
            $options: 'i',
          },
        },
      ],
    },
  };
};

const fetchCategoriesPayload = async ({
  app, objectType, searchString, tagCategory,
}) => {
  const waivioMain = !app.inherited && !app.canBeExtended;
  const searchStage = buildSearchMatchStage(searchString);

  const selectedTagsCondition = {};

  const normalizedTags = normalizeTagCategories(tagCategory);
  if (normalizedTags.length) {
    const andConditions = [];
    for (const { categoryName, tags } of normalizedTags) {
      for (const tag of tags) {
        andConditions.push({
          'fields.name': 'categoryItem',
          'fields.body': tag,
          'fields.tagCategory': categoryName,
          'fields.weight': { $gte: 0 },
        });
      }
    }
    if (andConditions.length) selectedTagsCondition.$and = andConditions;
  }

  const pipeline = [
    {
      $match: {
        ...(!waivioMain && { 'authority.administrative': { $in: getAppAuthorities(app) } }),
        object_type: objectType,
        'status.title': { $nin: REMOVE_OBJ_STATUSES },
        ...selectedTagsCondition,
      },
    }, {
      $unwind: {
        path: '$fields',
      },
    }, {
      $match: {
        'fields.name': 'categoryItem',
        'fields.weight': { $gte: 0 },
      },
    }, {
      $group: {
        _id: '$fields.body',
        tagCategories: {
          $addToSet: '$fields.tagCategory',
        },
      },
    },
  ];
  if (searchStage) pipeline.unshift(searchStage);

  const { wobjects: result, error } = await Wobj.fromAggregation(pipeline);
  if (error) return { error };

  const myMap = buildCategoryMap(result);
  return {
    result: Array.from(
      myMap,
      ([categoryName, tags]) => ({
        tagCategory: categoryName,
        tags: sortAlphabetically(tags),
      }),
    ),
  };
};

const fetchCategoryTagsPayload = async ({
  app,
  objectType,
  tagCategory,
  searchString,
  selectedTags,
}) => {
  const waivioMain = !app.inherited && !app.canBeExtended;
  const searchStage = buildSearchMatchStage(searchString);

  const selectedTagsCondition = {};

  if (selectedTags?.length) {
    selectedTagsCondition.$and = selectedTags.map((el) => ({
      'fields.name': 'categoryItem',
      'fields.body': el,
      'fields.tagCategory': tagCategory,
      'fields.weight': { $gte: 0 },
    }));
  }

  const pipeline = [
    {
      $match: {
        ...(!waivioMain && { 'authority.administrative': { $in: getAppAuthorities(app) } }),
        object_type: objectType,
        'status.title': { $nin: REMOVE_OBJ_STATUSES },
        ...selectedTagsCondition,
      },
    }, {
      $unwind: {
        path: '$fields',
      },
    }, {
      $match: {
        'fields.name': 'categoryItem',
        'fields.tagCategory': tagCategory,
        'fields.weight': { $gte: 0 },
      },
    }, {
      $group: {
        _id: '$fields.body',
      },
    },
  ];
  if (searchStage) pipeline.unshift(searchStage);

  const { wobjects: result, error } = await Wobj.fromAggregation(pipeline);
  if (error) return { error };

  return {
    result: {
      tagCategory,
      tags: sortAlphabetically(result.map((item) => item._id)),
    },
  };
};

const getCategoriesByObjectType = async ({
  app, objectType, tagsLimit = 3, searchString, tagCategory,
}) => {
  const cacheKey = buildCategoriesCacheKey({
    app, objectType, searchString, tagCategory,
  });
  const basePayload = await staleWhileRevalidate({
    key: cacheKey,
    ttlSeconds: HOUR_IN_SECONDS,
    fetcher: () => fetchCategoriesPayload({
      app, objectType, searchString, tagCategory,
    }),
  });

  if (basePayload?.error) return basePayload;
  if (!basePayload?.result) return { result: [] };

  return {
    result: basePayload.result.map(({ tagCategory: categoryName, tags }) => ({
      tagCategory: categoryName,
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
  searchString,
  selectedTags,
}) => {
  const cacheKey = buildCategoryTagsCacheKey({
    app, objectType, tagCategory, searchString, selectedTags,
  });
  const basePayload = await staleWhileRevalidate({
    key: cacheKey,
    ttlSeconds: HOUR_IN_SECONDS,
    fetcher: () => fetchCategoryTagsPayload({
      app,
      objectType,
      tagCategory,
      searchString,
      selectedTags,
    }),
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
