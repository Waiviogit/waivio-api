const _ = require('lodash');
const { FIELDS_NAMES, OBJECT_TYPES, REMOVE_OBJ_STATUSES } = require('constants/wobjectsData');
const { Wobj } = require('models');
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

const getMongoFilterForShop = (field) => _.reduce(field, (acc, el, index) => {
  if (index === 'type') {
    acc.object_type = field[index];
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
    acc.$or ? acc.$or.push(...departmentsOr) : acc.$or = departmentsOr;
    return acc;
  }
  if (index === 'tags') {
    acc.fields = { $elemMatch: { name: 'categoryItem', body: { $in: field[index] } } };
    return acc;
  }
  if (index === 'authorities') {
    const authoritiesOr = _.flatten(_.map(field[index], (user) => [
      { 'authority.ownership': user },
      { 'authority.administrative': user },
    ]));
    acc.$or ? acc.$or.push(...authoritiesOr) : acc.$or = authoritiesOr;
    return acc;
  }
  return acc;
}, { 'status.title': { $nin: REMOVE_OBJ_STATUSES } });

const getWobjectFilter = async ({ authorPermlink, app }) => {
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

  return { filter: getMongoFilterForShop(field) };
};

const mainFilterDepartment = (departments) => {
  if (_.isEmpty(departments)) return [];

  return _.chain(departments)
    .orderBy('objectsCount', ['asc'])
    .reduce((acc, el) => {
      if (acc.length < 20) {
        acc.push(el);
        return acc;
      }
      const inRelated = _.find(acc, (accEl) => _.includes(accEl.related, el.name));
      if (inRelated) {
        const myInd = _.indexOf(acc, inRelated);
        acc.splice(myInd, 1);
        acc.push(el);
      } else {
        let revIndex = 1;
        for (const revel of _.reverse(acc)) {
          const revRelated = _.find(acc, (accEl) => _.includes(accEl.related, revel.name));
          if (revRelated) {
            revIndex = _.indexOf(acc, revRelated);
          }
        }
        acc.splice(revIndex, 1);
        acc.push(el);
      }

      return acc;
    }, [])
    .value();
};

const secondaryFilterDepartment = ({ allDepartments, name, excluded }) => {
  const preFilter = _.filter(allDepartments,
    (department) => {
      const mainCondition = department.name !== name
      && !_.includes(excluded, department.name);
      return !name ? mainCondition : mainCondition && _.includes(department.related, name);
    });

  const objectsTotal = _.sumBy(preFilter, 'objectsCount');
  const topCounter = objectsTotal * TOP_LINE_PERCENT;
  const bottomCounter = objectsTotal * BOTTOM_LINE_PERCENT;

  const filterCondition = (d) => d.objectsCount < topCounter
    && d.objectsCount > bottomCounter
    && d.objectsCount > MIN_SUB_OBJECTS;

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

module.exports = {
  makeFilterCondition,
  subdirectoryMap,
  secondaryFilterDepartment,
  mainFilterDepartment,
  getWobjectFilter,
  getDefaultGroupStage,
  orderBySubdirectory,
};
