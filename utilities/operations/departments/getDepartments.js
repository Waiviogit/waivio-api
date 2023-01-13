const { Department } = require('models');
const _ = require('lodash');

const MIN_SUB_OBJECTS = 10;
const TOP_LINE_PERCENT = 0.3;
const BOTTOM_LINE_PERCENT = 0.05;

const filterDepartments = (departments, excluded = []) => {
  const objectsTotal = _.sumBy(departments, 'objectsCount');
  const topCounter = objectsTotal * TOP_LINE_PERCENT;
  const bottomCounter = objectsTotal * BOTTOM_LINE_PERCENT;

  const filterCondition = _.isEmpty(excluded)
    ? (d) => d.objectsCount < topCounter
    : (d) => d.objectsCount < topCounter && d.objectsCount > bottomCounter;

  return departments.filter(filterCondition);
};

const mapDepartments = async (departments, excluded = []) => {
  const result = [];
  for (const department of departments) {
    const filterCondition = (el) => el !== department.name && !excluded.includes(el);

    const { result: subDepartments = [] } = await Department.find(
      {
        filter: makeConditions({ name: department.name, excluded }),
      },
    );
    const filtered = filterDepartments(subDepartments, [department.name, ...excluded]);

    const subdirectory = !_.isEmpty(filtered) && department.objectsCount > MIN_SUB_OBJECTS;

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

const makeConditions = ({ name, names, excluded = [] }) => {
  if (name) return { name: { $nin: [name, ...excluded] }, related: name };
  if (names) return { name: { $in: names } };
  return { level: 1 };
};

const getDepartmentsOnWobject = async (departments) => Promise.all(departments.map(async (d) => {
  const emptyDirectory = {
    name: d.name,
    subdirectory: false,
    related: [d.name],
  };
  const { result: subDepartments = [] } = await Department.find(
    {
      filter: makeConditions({ name: d.name }),
    },
  );
  if (_.isEmpty(subDepartments)) return emptyDirectory;
  const filtered = filterDepartments(subDepartments);
  if (_.isEmpty(filtered)) return emptyDirectory;
  return {
    name: d.name,
    subdirectory: true,
    related: _.map(filtered, 'name'),
  };
}));

// we can add host in future for sites
module.exports = async ({ name, names = [], excluded = [] }) => {
  const { result: departments, error } = await Department.find(
    {
      filter: makeConditions({ name, names, excluded }),
      ...(!_.isEmpty(names) && { options: { sort: { objectsCount: -1 }, limit: 7 } }),
    },
  );

  if (error) return { error };
  if (_.isEmpty(departments)) return { result: [] };

  const topLevel = !name && _.isEmpty(names);
  if (topLevel) return { result: await mapDepartments(departments) };
  if (name) {
    return {
      result: await mapDepartments(
        filterDepartments(departments, [...excluded, name]),
        [...excluded, name],
      ),
    };
  }

  return { result: await getDepartmentsOnWobject(departments) };
};
