const { Wobj } = require('../../../models');
const { getAppAuthorities } = require('../../helpers/appHelper');

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

const getCategoriesByObjectType = async ({ app, objectType, tagsLimit = 3 }) => {
  const { wobjects: result } = await Wobj.fromAggregation([
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

  const myMap = buildCategoryMap(result);
  return Array.from(
    myMap,
    ([tagCategory, tags]) => ({
      tagCategory,
      tags: sortAlphabetically(tags).slice(0, tagsLimit),
      hasMore: tags.length > tagsLimit,
    }),
  );
};

const getCategoryTagsByObjectType = async ({
  app,
  objectType,
  tagCategory,
  skip = 0,
  limit = 10,
}) => {
  const { wobjects: result } = await Wobj.fromAggregation([
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

  const sortedTags = sortAlphabetically(result.map((item) => item._id));
  const pagedTags = sortedTags.slice(skip, skip + limit);
  return {
    tagCategory,
    tags: pagedTags,
    hasMore: sortedTags.length > skip + limit,
  };
};

module.exports = { getCategoriesByObjectType, getCategoryTagsByObjectType };
