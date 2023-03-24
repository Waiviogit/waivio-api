const shopHelper = require('utilities/helpers/shopHelper');
const { Wobj } = require('models');
const _ = require('lodash');
const { UNCATEGORIZED_DEPARTMENT, OTHERS_DEPARTMENT } = require('constants/departments');

const getWobjectDepartments = async ({
  authorPermlink, app, name, excluded, wobjectFilter, path,
}) => {
  const emptyResult = { result: [] };
  if (!wobjectFilter) {
    ({ wobjectFilter } = await shopHelper
      .getWobjectFilter({ app, authorPermlink }));
  }

  if (_.isEmpty(wobjectFilter)) return emptyResult;
  // or we can group in aggregation
  const { result } = await Wobj.findObjects({
    filter: wobjectFilter,
    projection: { departments: 1, metaGroupId: 1 },
  });

  const uncategorized = _.filter(result, (r) => _.isEmpty(r.departments));
  const groupedResult = _.groupBy(result, 'metaGroupId');

  const allDepartments = shopHelper.getDepartmentsFromObjects(groupedResult, path);

  const filteredDepartments = name && name !== OTHERS_DEPARTMENT
    ? shopHelper.secondaryFilterDepartment({
      allDepartments, name, excluded, path,
    })
    : shopHelper.mainFilterDepartment(allDepartments);

  const mappedDepartments = shopHelper.subdirectoryMap({
    filteredDepartments,
    allDepartments: groupedResult,
    excluded,
    path,
  });

  const orderedDepartments = shopHelper.orderBySubdirectory(mappedDepartments);

  if (orderedDepartments.length > 20 && !name) {
    orderedDepartments.splice(20, orderedDepartments.length);
    orderedDepartments.push({
      name: OTHERS_DEPARTMENT,
      subdirectory: true,
    });
  }

  if (name === OTHERS_DEPARTMENT) {
    orderedDepartments.splice(0, 20);
  }

  if (!name && uncategorized.length) {
    orderedDepartments.push({
      name: UNCATEGORIZED_DEPARTMENT,
      subdirectory: false,
    });
  }

  return { result: orderedDepartments };
};

module.exports = getWobjectDepartments;
