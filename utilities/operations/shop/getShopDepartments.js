const { Department } = require('models');
const shopHelper = require('utilities/helpers/shopHelper');
const _ = require('lodash');
const {
  filterDepartments, mapDepartments, getDepartmentsOnWobject,
} = require('utilities/operations/departments/departmentsMapper');

const makeConditions = ({ name, excluded = [] }) => {
  if (name) return { name: { $nin: [name, ...excluded] }, related: name };
  return { level: 1 };
};

// we can add host in future for sites
module.exports = async ({ name, excluded = [] } = {}) => {
  const { result: departments, error } = await Department.find(
    {
      filter: makeConditions({ name, excluded }),
      options: { sort: { sortScore: 1, objectsCount: -1 } },
    },
  );

  if (error) return { error };
  if (_.isEmpty(departments)) return { result: [] };

  if (!name) return { result: await mapDepartments(departments) };
  if (name) {
    return {
      result: await mapDepartments(
        filterDepartments(departments, [...excluded, name]),
        [...excluded, name],
      ),
    };
  }

  const result = await getDepartmentsOnWobject(departments);

  return { result: shopHelper.orderBySubdirectory(result) };
};
