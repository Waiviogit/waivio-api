const shopHelper = require('utilities/helpers/shopHelper');
const { Wobj } = require('models');
const _ = require('lodash');
const { UNCATEGORIZED_DEPARTMENT } = require('constants/departments');

const getWobjectDepartments = async ({
  authorPermlink, app, name, excluded, wobjectFilter,
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
    projection: { departments: 1 },
  });

  const uncategorized = _.filter(result, (r) => _.isEmpty(r.departments));

  const allDepartments = shopHelper.getDepartmentsFromObjects(result);

  const filteredDepartments = name
    ? shopHelper.secondaryFilterDepartment({ allDepartments, name, excluded })
    : shopHelper.mainFilterDepartment(allDepartments);

  const mappedDepartments = shopHelper.subdirectoryMap({ filteredDepartments, allDepartments });

  const orderedDepartments = shopHelper.orderBySubdirectory(mappedDepartments);

  if (!name && uncategorized.length) {
    orderedDepartments.push({
      name: UNCATEGORIZED_DEPARTMENT,
      subdirectory: false,
    });
  }

  return { result: orderedDepartments };
};

module.exports = getWobjectDepartments;
