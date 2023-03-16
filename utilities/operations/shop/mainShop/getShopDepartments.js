const { Department, Wobj } = require('models');
const shopHelper = require('utilities/helpers/shopHelper');
const _ = require('lodash');
const {
  filterDepartments, mapDepartments, getDepartmentsOnWobject,
} = require('utilities/operations/departments/departmentsMapper');
const { UNCATEGORIZED_DEPARTMENT } = require('constants/departments');

const makeConditions = ({ name, excluded = [], path = [] }) => {
  if (name) return { name: { $nin: [name, ...excluded] }, related: { $all: [name, ...path] } };
  return { level: 1 };
};

// we can add host in future for sites
module.exports = async ({ name, excluded = [], path = [] } = {}) => {
  const { result: departments, error } = await Department.find(
    {
      filter: makeConditions({ name, excluded, path }),
      options: { sort: { sortScore: 1, objectsCount: -1 } },
    },
  );

  const { result: uncategorized } = await Wobj
    .findOne({ $or: [{ departments: [] }, { departments: null }] });

  if (error) return { error };
  if (_.isEmpty(departments)) return { result: [] };

  if (!name) {
    const mappedDepartments = await mapDepartments(departments);
    if (uncategorized) {
      mappedDepartments.push({
        name: UNCATEGORIZED_DEPARTMENT,
        subdirectory: false,
      });
    }
    return { result: mappedDepartments };
  }
  if (name) {
    return {
      result: await mapDepartments(
        filterDepartments(departments, [...excluded, name]),
        [...excluded, name],
        path,
      ),
    };
  }

  const result = await getDepartmentsOnWobject(departments);

  return { result: shopHelper.orderBySubdirectory(result) };
};
