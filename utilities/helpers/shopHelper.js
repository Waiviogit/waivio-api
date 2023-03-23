const _ = require('lodash');
const {
  FIELDS_NAMES, OBJECT_TYPES, REMOVE_OBJ_STATUSES, SHOP_OBJECT_TYPES,
} = require('constants/wobjectsData');
const { Wobj, ObjectType } = require('models');
const { OTHERS_DEPARTMENT } = require('constants/departments');
const wObjectHelper = require('./wObjectHelper');
const jsonHelper = require('./jsonHelper');

const MIN_SUB_OBJECTS = 10;
const TOP_LINE_PERCENT = 0.3;
const BOTTOM_LINE_PERCENT = 0.05;

const makeFilterCondition = (filter = {}) => {
  const result = {};
  if (_.get(filter, FIELDS_NAMES.TAG_CATEGORY)) {
    const condition = [];
    for (const category of filter.tagCategory) {
      condition.push({
        fields: {
          $elemMatch: {
            name: FIELDS_NAMES.CATEGORY_ITEM,
            body: { $in: category.tags },
            tagCategory: category.categoryName,
            weight: { $gte: 0 },
          },
        },
      });
    }

    if (condition.length) result.$or = condition;
  }
  if (filter.rating) {
    result.fields = { $elemMatch: { average_rating_weight: { $gte: filter.rating } } };
  }
  return result;
};

const getMongoFilterForShop = ({ field, tagFilter }) => {
  const fieldCondition = _.reduce(field, (acc, el, index) => {
    if (index === 'type') {
      if (!_.isEmpty(field[index])) {
        acc.object_type = field[index];
      }
      return acc;
    }
    if (index === 'departments') {
      const departmentsOr = _.reduce(field[index], (innerAcc, innerEl) => {
        if (Array.isArray(innerEl) && innerEl.length) {
          innerAcc.push(
            {
              departments: {
                $all: innerEl,
              },
            },
          );
        }
        return innerAcc;
      }, []);
      if (!_.isEmpty(departmentsOr)) {
        acc.$or ? acc.$or.push(...departmentsOr) : acc.$or = departmentsOr;
      }
      return acc;
    }
    if (index === 'tags') {
      if (!_.isEmpty(field[index])) {
        acc.fields = { $elemMatch: { name: 'categoryItem', body: { $in: field[index] } } };
      }
      return acc;
    }
    if (index === 'authorities') {
      const authoritiesOr = _.flatten(_.map(field[index], (user) => [
        { 'authority.ownership': user },
        { 'authority.administrative': user },
      ]));
      if (!_.isEmpty(authoritiesOr)) {
        acc.$or ? acc.$or.push(...authoritiesOr) : acc.$or = authoritiesOr;
      }
      return acc;
    }
    return acc;
  }, { 'status.title': { $nin: REMOVE_OBJ_STATUSES } });

  if (_.isEmpty(tagFilter)) return fieldCondition;

  if (fieldCondition.$or) {
    return {
      ..._.omit(fieldCondition, '$or'),
      $and: [
        { $or: fieldCondition.$or },
        tagFilter,
      ],
    };
  }
  return {
    ...fieldCondition,
    ...tagFilter,
  };
};

const getWobjectFilter = async ({ authorPermlink, app, tagFilter }) => {
  const { result } = await Wobj.findOne({
    author_permlink: authorPermlink,
    object_type: OBJECT_TYPES.SHOP,
  });
  if (!result) return { error: { status: 404, message: 'Not Found' } };
  const processedObject = await wObjectHelper.processWobjects({
    wobjects: [result],
    returnArray: false,
    app,
    fields: [FIELDS_NAMES.SHOP_FILTER],
  });

  if (!processedObject[FIELDS_NAMES.SHOP_FILTER]) return { error: { status: 404, message: 'Not Found' } };
  const field = jsonHelper.parseJson(processedObject[FIELDS_NAMES.SHOP_FILTER], null);
  if (_.isEmpty(field)) return { error: { status: 404, message: 'Not Found' } };

  return { wobjectFilter: getMongoFilterForShop({ field, tagFilter }) };
};

const mainFilterDepartment = (departments) => {
  if (_.isEmpty(departments)) return [];

  return _.chain(departments)
    .orderBy('objectsCount', ['desc'])
    .reduce((acc, el, index) => {
      if (!index) {
        acc.push(el);
        return acc;
      }
      const inRelated = _.find(acc, (accEl) => _.includes(accEl.related, el.name));
      if (inRelated) return acc;
      acc.push(el);
      return acc;
    }, [])
    .value();
};

const secondaryFilterDepartment = ({
  allDepartments, name, excluded, path = [],
}) => {
  path = _.filter(path, (p) => p !== OTHERS_DEPARTMENT);
  const preFilter = _.filter(allDepartments,
    (department) => {
      const mainCondition = department.name !== name
      && !_.includes(excluded, department.name);
      return !name
        ? mainCondition
        : mainCondition && _.every([...path, name], (r) => _.includes(department.related, r));
    });

  const objectsTotal = _.sumBy(preFilter, 'objectsCount');
  const topCounter = objectsTotal * TOP_LINE_PERCENT;
  const bottomCounter = objectsTotal * BOTTOM_LINE_PERCENT;

  const filterCondition = (d) => d.objectsCount < topCounter
    && d.objectsCount > bottomCounter
   // && d.objectsCount > MIN_SUB_OBJECTS;
  return _.filter(preFilter, filterCondition);
};

const subdirectoryMap = ({ filteredDepartments, allDepartments }) => _
  .map(filteredDepartments, (department) => {
    const subdirectories = _.filter(
      allDepartments,
      (d) => _.includes(d.related, department.name)
          && d.objectsCount < department.objectsCount
          && d.objectsCount > 10,
    );
    // second filter
    const subFilter = secondaryFilterDepartment({
      allDepartments: subdirectories,
      excluded: _.map(filteredDepartments, 'name'),
      name: department.name,
    });

    const subdirectoriesCondition = subFilter.length > 1;

    return {
      name: department.name,
      subdirectory: subdirectoriesCondition,
      objectsCount: department.objectsCount,
    };
  });

const getDefaultGroupStage = () => [
  { $sort: { weight: -1 } },
  {
    $group: {
      _id: '$metaGroupId',
      doc: { $first: '$$ROOT' },
    },
  },
  {
    $replaceRoot: {
      newRoot: '$doc',
    },
  },
];

const orderBySubdirectory = (departments) => _
  .orderBy(departments, ['subdirectory', 'objectsCount'], ['desc', 'desc']);

const getDepartmentsFromObjects = (objects, path) => {
  const departmentsMap = new Map();

  for (const object in objects) {
    const departments = _.flatten(_.map(objects[object], 'departments'));
    for (const department of departments) {
      const { related = [], metaGroupIds = [] } = departmentsMap.get(department) ?? {};
      const filter = !_.every(path, (p) => _.includes(related, p))
      const relatedToPush = filter
        ? _.filter(related, (r) => !_.includes(path, r))
        : related;
      const updatedMetaGroupIds = [...new Set([object, ...metaGroupIds])]
      departmentsMap.set(department, {
        name: department,
        related: [...new Set([
          ...relatedToPush,
          ...departments
        ])],
        metaGroupIds: updatedMetaGroupIds,
        objectsCount: updatedMetaGroupIds.length,
      });
    }
  }


  return [...departmentsMap.values()];
};

const getUniqArrayWithScore = (arr) => {
  const count = {};
  for (const str of arr) {
    count[str] = (count[str] || 0) + 1;
  }

  const unique = [];
  for (const str of arr) {
    if (!unique.some((obj) => obj.value === str)) {
      unique.push({ value: str, score: count[str] });
    }
  }
  return unique;
};

const getTagCategoriesForFilter = async () => {
  const { result: objectTypes, error } = await ObjectType
    .find({ filter: { name: { $in: SHOP_OBJECT_TYPES } } });

  if (_.isEmpty(objectTypes) || error) {
    return { error: new Error('Categories not found') };
  }

  const tagCategories = _.reduce(objectTypes, (acc, el) => {
    const tagCategory = _.find(el.supposed_updates, (u) => u.name === 'tagCategory');
    if (!tagCategory) return acc;
    return [...acc, ...tagCategory.values];
  }, []);

  return { result: tagCategories };
};

const getFilteredTagCategories = ({ objects, tagCategories }) => {
  const tagCategoryFilters = [];

  const fields = _.chain(objects)
    .map('fields')
    .flatten()
    .filter((f) => _.includes(tagCategories, f.tagCategory))
    .value();

  for (const category of tagCategories) {
    const categoryFields = getUniqArrayWithScore(
      _.map(_.filter(fields, (f) => category === f.tagCategory), 'body'),
    );
    if (_.isEmpty(categoryFields)) continue;
    const tags = _.chain(categoryFields).orderBy(['score'], ['desc']).map('value').take(3)
      .value();

    tagCategoryFilters.push({
      tagCategory: category,
      tags,
      hasMore: categoryFields.length > tags.length,
    });
  }

  return tagCategoryFilters;
};

const getMoreTagsForCategory = ({
  objects, tagCategory, skip, limit,
}) => {
  const fields = _.chain(objects)
    .map('fields')
    .flatten()
    .filter((f) => f.tagCategory === tagCategory)
    .value();

  const categoryFields = getUniqArrayWithScore(
    _.map(fields, 'body'),
  );
  const tags = _.chain(categoryFields).orderBy(['score'], ['desc']).map('value').slice(skip, skip + limit)
    .value();

  return {
    tags,
    hasMore: categoryFields.length > tags.length + skip,
  };
};

module.exports = {
  makeFilterCondition,
  subdirectoryMap,
  secondaryFilterDepartment,
  mainFilterDepartment,
  getWobjectFilter,
  getDefaultGroupStage,
  orderBySubdirectory,
  getDepartmentsFromObjects,
  getUniqArrayWithScore,
  getTagCategoriesForFilter,
  getFilteredTagCategories,
  getMoreTagsForCategory,
};
