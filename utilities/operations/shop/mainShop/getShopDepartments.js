const _ = require('lodash');
const { Department, Wobj } = require('../../../../models');
const shopHelper = require('../../../helpers/shopHelper');
const {
  filterDepartments, mapDepartments, getDepartmentsOnWobject,
} = require('../../departments/departmentsMapper');
const { UNCATEGORIZED_DEPARTMENT } = require('../../../../constants/departments');
const {
  CACHE_KEY,
  TTL_TIME,
} = require('../../../../constants/common');
const {
  getCacheKey,
  getCachedData,
  setCachedData,
} = require('../../../helpers/cacheHelper');
const jsonHelper = require('../../../helpers/jsonHelper');

const makeConditions = ({ name, excluded = [], path = [] }) => {
  if (name) return { name: { $nin: [name, ...excluded] }, related: { $all: [name, ...path] } };
  return { level: 1 };
};

// we can add host in future for sites
module.exports = async ({ name, excluded = [], path = [] } = {}) => {
  const key = `${CACHE_KEY.MAIN_SHOP_DEPARTMENTS}:${getCacheKey({
    name, path, excluded,
  })}`;
  const cache = await getCachedData(key);
  if (cache) {
    return jsonHelper.parseJson(cache, { result: [] });
  }

  const { result: departments, error } = await Department.find(
    {
      filter: makeConditions({ name, excluded, path }),
      options: { sort: { sortScore: 1, objectsCount: -1 } },
    },
  );

  if (error) return { error };
  if (_.isEmpty(departments)) return { result: [] };

  if (!name) {
    const { result: uncategorized } = await Wobj
      .findOne({ departments: { $in: [null, []] } });

    const mappedDepartments = await mapDepartments(departments);
    if (uncategorized) {
      mappedDepartments.push({
        name: UNCATEGORIZED_DEPARTMENT,
        subdirectory: false,
      });
    }
    const result = shopHelper.omitRelated(mappedDepartments);

    await setCachedData({
      key,
      data: { result },
      ttl: TTL_TIME.ONE_DAY,
    });
    return { result };
  }

  const mappedDepartments = await mapDepartments(
    await filterDepartments(departments, [...excluded, name], path),
    [...excluded, name],
    path,
  );
  const result = shopHelper.omitRelated(
    shopHelper.orderBySubdirectory(mappedDepartments),
  );

  await setCachedData({
    key,
    data: { result },
    ttl: TTL_TIME.THIRTY_MINUTES,
  });
  return { result };
};
