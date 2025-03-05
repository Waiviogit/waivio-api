const _ = require('lodash');
const { Department } = require('../../../models');
const {
  filterDepartments, mapDepartments, getDepartmentsOnWobject, makeConditions,
} = require('./departmentsMapper');

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
        await filterDepartments(departments, [...excluded, name]),
        [...excluded, name],
      ),
    };
  }

  return { result: await getDepartmentsOnWobject(departments) };
};
