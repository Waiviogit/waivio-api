const _ = require('lodash');
const { Department, Wobj } = require('../../../models');

const MIN_SUB_OBJECTS = 10;
const TOP_LINE_PERCENT = 0.3;
const BOTTOM_LINE_PERCENT = 0.01;

const getObjWithPath = async (path) => {
  const { result } = await Wobj.findOne(
    { departments: { $all: path } },
    { _id: 1 },
  );

  return !!result;
};

const filterDepartments = async (departments, excluded = [], path = []) => {
  const objectsTotal = _.sumBy(departments, 'objectsCount');
  const topCounter = objectsTotal * TOP_LINE_PERCENT;
  const bottomCounter = objectsTotal * BOTTOM_LINE_PERCENT;

  const filterCondition = _.isEmpty(excluded)
    ? (d) => d.objectsCount < topCounter
    : (d) => d.objectsCount < topCounter
      && d.objectsCount > bottomCounter
      && d.objectsCount > MIN_SUB_OBJECTS;

  const filtered = _.filter(departments, filterCondition);
  if (!path.length) return filtered;

  const result = [];

  for (const el of filtered) {
    const existObjects = await getObjWithPath([el.name, ...path]);
    if (!existObjects) continue;
    result.push(el);
  }

  return result;
};

const mapDepartments = async (departments, excluded = [], path = []) => {
  const result = [];
  const additionalExcluded = _.map(departments, 'name');

  for (const department of departments) {
    const filterCondition = (el) => el !== department.name && !excluded.includes(el);

    const { result: subDepartments = [] } = await Department.find(
      {
        filter: makeConditions({ name: department.name, excluded: [...excluded, ...additionalExcluded], path }),
      },
    );

    const filtered = await filterDepartments(
      subDepartments,
      [department.name, ...excluded, ...additionalExcluded],
      [department.name, ...path],
    );

    const subdirectory = department.objectsCount > MIN_SUB_OBJECTS
      && filtered.length > 1;

    const related = subdirectory
      ? _.filter(department.related, filterCondition)
      : [department.name];

    result.push({
      name: department.name,
      subdirectory,
      related,
    });
  }
  return result;
};

const makeConditions = ({
  name, names, excluded = [], path = [],
}) => {
  if (name) {
    return {
      name: { $nin: [name, ...excluded] },
      related: { $all: [name, ...path] },
      level: { $ne: 1 },
    };
  }
  if (names) return { name: { $in: names } };
  return { level: 1 };
};

const getDepartmentsOnWobject = async (departments) => Promise.all(departments.map(async (d) => {
  const emptyDirectory = {
    name: d.name,
    subdirectory: false,
    objectsCount: 0,
  };
  const { result: subDepartments = [] } = await Department.find(
    {
      filter: makeConditions({ name: d.name }),
    },
  );
  if (_.isEmpty(subDepartments)) return emptyDirectory;
  const filtered = await filterDepartments(subDepartments);
  if (_.isEmpty(filtered)) return emptyDirectory;
  return {
    name: d.name,
    subdirectory: true,
    objectsCount: d.objectsCount,
  };
}));

module.exports = {
  getDepartmentsOnWobject,
  mapDepartments,
  filterDepartments,
  makeConditions,
};
