const {
  Wobj,
} = require('../../../../models');
const { REMOVE_OBJ_STATUSES } = require('../../../../constants/wobjectsData');
const _ = require('lodash');
const { UNCATEGORIZED_DEPARTMENT, OTHERS_DEPARTMENT } = require('../../../../constants/departments');
const shopHelper = require('../../../helpers/shopHelper');
const { getCachedData, getCacheKey, setCachedData } = require('../../../helpers/cacheHelper');
const jsonHelper = require('../../../helpers/jsonHelper');
const { CACHE_KEY, TTL_TIME } = require('../../../../constants/common');

const getTopDepartments = async ({
  userName,
  name,
  excluded,
  path,
  app,
  userFilter,
  schema,
}) => {
  const key = `${CACHE_KEY.USER_SHOP_DEPARTMENTS}:${getCacheKey({
    userName, name, host: app.host, path, excluded, schema,
  })}`;
  const cache = await getCachedData(key);
  if (cache) {
    return jsonHelper.parseJson(cache, { result: [] });
  }

  if (!userFilter) userFilter = await shopHelper.getUserFilter({ userName, app, schema });

  const objectTypeCondition = shopHelper.getObjectTypeCondition(schema);

  const { result } = await Wobj.findObjects({
    filter: {
      ...userFilter,
      ...objectTypeCondition,
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

  await setCachedData({
    key, data: { result: orderedDepartments }, ttl: TTL_TIME.FIVE_MINUTES,
  });

  return { result: orderedDepartments };
};

module.exports = {
  getTopDepartments,
};
