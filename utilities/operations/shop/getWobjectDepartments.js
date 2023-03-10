const shopHelper = require('utilities/helpers/shopHelper');
const { Wobj, Department } = require('models');
const _ = require('lodash');

const getWobjectDepartments = async ({
  authorPermlink, app, name, excluded, filter,
}) => {
  const emptyResult = { result: [] };
  if (!filter) ({ filter } = await shopHelper.getWobjectFilter({ app, authorPermlink }));

  if (_.isEmpty(filter)) return emptyResult;
  // or we can group in aggregation
  const { result } = await Wobj.findObjects({
    filter,
    projection: { departments: 1 },
  });
  const allDepartments = shopHelper.getDepartmentsFromObjects(result);

  const filteredDepartments = name
    ? shopHelper.secondaryFilterDepartment({ allDepartments, name, excluded })
    : shopHelper.mainFilterDepartment(allDepartments);

  const mappedDepartments = shopHelper.subdirectoryMap({ filteredDepartments, allDepartments });

  return { result: shopHelper.orderBySubdirectory(mappedDepartments) };
};

module.exports = getWobjectDepartments;
