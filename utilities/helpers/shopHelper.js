const _ = require('lodash');
const {
  FIELDS_NAMES, OBJECT_TYPES, REMOVE_OBJ_STATUSES, SHOP_OBJECT_TYPES,
} = require('constants/wobjectsData');
const {
  Wobj, ObjectType, User, Post, userShopDeselectModel,
} = require('models');
const { OTHERS_DEPARTMENT } = require('constants/departments');
const { SELECT_USER_CAMPAIGN_SHOP } = require('constants/usersData');
const { SHOP_SCHEMA } = require('constants/shop');
const wObjectHelper = require('./wObjectHelper');
const jsonHelper = require('./jsonHelper');
const { checkForSocialSite } = require('./sitesHelper');
const sitesHelper = require('./sitesHelper');

const MIN_SUB_OBJECTS = 10;
const TOP_LINE_PERCENT = 0.3;
const BOTTOM_LINE_PERCENT = 0.01;

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

const getMongoFilterForShop = ({ field, tagFilter, authority = [] }) => {
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
      if (authority.length) {
        authoritiesOr.push(..._.flatten(_.map(authority, (user) => [
          { 'authority.ownership': user },
          { 'authority.administrative': user },
        ])));
      }
      if (!_.isEmpty(authoritiesOr)) {
        acc.$or ? acc.$or.push(...authoritiesOr) : acc.$or = authoritiesOr;
      }
      return acc;
    }
    return acc;
  }, { 'status.title': { $nin: REMOVE_OBJ_STATUSES } });

  if (!fieldCondition?.$or && authority.length) {
    fieldCondition.$or = _.flatten(_.map(authority, (user) => [
      { 'authority.ownership': user },
      { 'authority.administrative': user },
    ]));
  }
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
  const authority = [];
  const social = checkForSocialSite(app?.parentHost ?? '');
  if (social) {
    authority.push(...[app.owner, ...app.authority]);
  }
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

  return { wobjectFilter: getMongoFilterForShop({ field, tagFilter, authority }) };
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
  const preFilter = _.filter(
    allDepartments,
    (department) => {
      const mainCondition = department.name !== name
      && !_.includes(excluded, department.name);
      return !name
        ? mainCondition
        : mainCondition && _.every([...path, name], (r) => _.includes(department.related, r));
    },
  );

  const objectsTotal = _.sumBy(preFilter, 'objectsCount');
  const topCounter = objectsTotal * TOP_LINE_PERCENT;
  const bottomCounter = objectsTotal * BOTTOM_LINE_PERCENT;

  const filterCondition = (d) => d.objectsCount < topCounter
    && d.objectsCount > bottomCounter
    && d.objectsCount > MIN_SUB_OBJECTS;

  const result = _.filter(preFilter, filterCondition);

  const diferenceWithID = _.reduce(_.orderBy(result, 'objectsCount', 'desc'), (acc, el) => {
    for (const accElement of acc) {
      const difference = _.difference(accElement.metaGroupIds, el.metaGroupIds);
      if (difference.length < 10) return acc;
    }
    acc.push(el);
    return acc;
  }, []);

  return diferenceWithID;
};

const subdirectoryMap = ({
  filteredDepartments, allDepartments, excluded = [], path = [],
}) => _
  .map(filteredDepartments, (department) => {
    const subdirectories = getDepartmentsFromObjects(allDepartments, [department.name, ...path]);

    const subFilter = secondaryFilterDepartment({
      allDepartments: subdirectories,
      excluded: [..._.map(filteredDepartments, 'name'), ...excluded],
      name: department.name,
      path,
    });

    const subdirectoriesCondition = subFilter.length > 1;

    return {
      name: department.name,
      subdirectory: subdirectoriesCondition,
      objectsCount: department.objectsCount,
    };
  });

const getDefaultGroupStage = ({ host } = {}) => {
  const pipe = [
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
  if (host) {
    pipe.push(...Wobj.getSortingStagesByHost({ host }));
  } else {
    pipe.push({ $sort: { weight: -1, _id: -1 } });
  }

  return pipe;
};

const orderBySubdirectory = (departments) => _
  .orderBy(departments, ['subdirectory', 'objectsCount'], ['desc', 'desc']);

const omitRelated = (departments) => departments.map((d) => (
  { name: d.name, subdirectory: d.subdirectory }));

const getDepartmentsFromObjects = (objects, path) => {
  path = _.filter(path, (p) => p !== OTHERS_DEPARTMENT);
  const departmentsMap = new Map();

  for (const object in objects) {
    const filteredPath = _.filter(
      objects[object],
      (o) => _.every(path, (p) => _.includes(o.departments, p)),
    );
    if (!filteredPath.length) continue;

    for (const item of filteredPath) {
      const departments = item?.departments;

      if (!departments?.length) continue;
      for (const department of departments) {
        if (!department) continue;
        const { related = [], metaGroupIds = [] } = departmentsMap.get(department) ?? {};
        const filter = !_.every(path, (p) => _.includes(related, p));
        const relatedToPush = filter
          ? _.filter(related, (r) => !_.includes(path, r))
          : related;
        const updatedMetaGroupIds = [...new Set([object, ...metaGroupIds])];

        relatedToPush.push(...departments);

        departmentsMap.set(department, {
          name: department,
          related: [...new Set(relatedToPush)],
          metaGroupIds: updatedMetaGroupIds,
          objectsCount: updatedMetaGroupIds.length,
        });
      }
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

const getFilteredTagCategories = ({ tags = [], tagCategories }) => {
  const tagCategoryFilters = [];

  for (const category of tagCategories) {
    const categoryTags = tags.find((el) => el?.tagCategory === category);

    const tagsArr = _.take(categoryTags?.tags, 3);

    tagCategoryFilters.push({
      tagCategory: category,
      tags: tagsArr,
      hasMore: categoryTags?.tags?.length > tagsArr.length,
    });
  }

  return tagCategoryFilters;
};

const getMoreTagsForCategory = ({
  objects, skip, limit,
}) => {
  const tagCategories = objects[0];

  const tags = _.slice(tagCategories?.tags, skip, skip + limit);

  const hasMore = tags?.length === limit;

  return {
    tags,
    hasMore,
  };
};

const pathToHideConfig = {
  [SHOP_SCHEMA.SHOP]: 'user_metadata.settings.shop.hideLinkedObjects',
  [SHOP_SCHEMA.RECIPE]: 'user_metadata.settings.hideRecipeObjects',
};

const getPathToHideConfig = (schema) => pathToHideConfig[schema]
  || pathToHideConfig[SHOP_SCHEMA.SHOP];

const getUserFilter = async ({
  userName, app, schema,
}) => {
  const social = sitesHelper.checkForSocialSite(app?.parentHost ?? '');
  const isMainObject = app?.configuration?.shopSettings?.value === userName;

  const users = social && isMainObject
    ? [...new Set([userName, ...app.authority])]
    : [userName];

  const deselectLinks = [];
  const wobjectsLinks = [];

  for (const acc of users) {
    const { user } = await User.getOne(acc, SELECT_USER_CAMPAIGN_SHOP);
    const hideLinkedObjects = _.get(user, getPathToHideConfig(schema), false);
    const wobjectsFromPosts = await Post.getProductLinksFromPosts({ userName: acc });

    if (!_.isEmpty(wobjectsFromPosts) && !hideLinkedObjects) {
      wobjectsLinks.push(...wobjectsFromPosts);
    }

    const deselect = await userShopDeselectModel.findUsersLinks({ userName: acc });
    if (deselect?.length) deselectLinks.push(...deselect);
  }

  const orFilter = [
    { 'authority.ownership': { $in: users } },
    { 'authority.administrative': { $in: users } },
  ];
  if (!_.isEmpty(wobjectsLinks)) {
    orFilter.push({ author_permlink: { $in: wobjectsLinks } });
  }

  return {
    $or: orFilter,
    ...(!_.isEmpty(deselectLinks) && { author_permlink: { $nin: deselectLinks } }),
  };
};

const objectTypesToSearch = {
  [SHOP_SCHEMA.SHOP]: { object_type: { $in: SHOP_OBJECT_TYPES } },
  [SHOP_SCHEMA.RECIPE]: { object_type: OBJECT_TYPES.RECIPE },
  default: { object_type: { $in: SHOP_OBJECT_TYPES } },
};

const getObjectTypeCondition = (schema) => objectTypesToSearch[schema]
  || objectTypesToSearch.default;

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
  getUserFilter,
  omitRelated,
  getObjectTypeCondition,
};
