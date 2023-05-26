const {
  Wobj,
} = require('models');
const { REMOVE_OBJ_STATUSES, SHOP_OBJECT_TYPES } = require('constants/wobjectsData');
const _ = require('lodash');
const { UNCATEGORIZED_DEPARTMENT, OTHERS_DEPARTMENT } = require('constants/departments');
const shopHelper = require('utilities/helpers/shopHelper');

exports.getTopDepartments = async ({
  userName,
  name,
  excluded,
  path,
  app,
  userFilter,
}) => {
  if (!userFilter) userFilter = await shopHelper.getUserFilter({ userName, app });

  const { result } = await Wobj.findObjects({
    filter: {
      ...userFilter,
      object_type: { $in: SHOP_OBJECT_TYPES },
      'status.title': { $nin: REMOVE_OBJ_STATUSES },
    },
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
