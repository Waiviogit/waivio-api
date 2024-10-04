const shopHelper = require('utilities/helpers/shopHelper');
const { Wobj } = require('models');
const _ = require('lodash');
const { UNCATEGORIZED_DEPARTMENT, OTHERS_DEPARTMENT } = require('constants/departments');
const {
  CACHE_KEY,
  TTL_TIME,
} = require('constants/common');
const {
  getCacheKey,
  getCachedData,
  setCachedData,
} = require('utilities/helpers/cacheHelper');
const jsonHelper = require('utilities/helpers/jsonHelper');

const getPipe = ({ condition, excluded = [] }) => {
  const pipeline = [
    {
      $match: condition,
    },
    {
      $unwind: {
        path: '$departments',
      },
    },
    {
      $group: {
        _id: '$metaGroupId',
        departments: { $addToSet: '$departments' },
        related: { $addToSet: '$departments' },
      },
    },
    {
      $unwind: {
        path: '$departments',
      },
    },
    {
      $group: {
        _id: '$departments',
        //   metaGroupIds: { $addToSet: '$_id' },
        objectsCount: { $sum: 1 },
        related: { $addToSet: '$related' },
      },
    },
    {
      $project: {
        name: '$_id',
        // metaGroupIds: 1,
        objectsCount: 1,
        related: {
          $reduce: {
            input: '$related',
            initialValue: [],
            in: { $setUnion: ['$$value', '$$this'] },
          },
        },
      },
    },
  ];

  // Conditionally add the excluded pipeline stage
  if (excluded.length > 0) {
    pipeline.splice(3, 0, { $match: { departments: { $nin: excluded } } });
  }

  return pipeline;
};

const getWobjectDepartments = async ({
  authorPermlink, app, name, excluded, wobjectFilter, path,
}) => {
  const emptyResult = { result: [] };

  const key = `${CACHE_KEY.OBJECT_SHOP_DEPARTMENTS}:${getCacheKey({
    authorPermlink, name, host: app.host, path, excluded,
  })}`;
  const cache = await getCachedData(key);
  if (cache) {
    return jsonHelper.parseJson(cache, emptyResult);
  }

  if (!wobjectFilter) {
    ({ wobjectFilter } = await shopHelper
      .getWobjectFilter({ app, authorPermlink }));
  }

  if (_.isEmpty(wobjectFilter)) return emptyResult;
  // or we can group in aggregation

  // excluded to pipe
  const { wobjects: result } = await Wobj.fromAggregation(getPipe({
    condition: wobjectFilter,
    excluded,
  }));

  // const uncategorized = _.filter(result, (r) => _.isEmpty(r.departments));
  // const groupedResult = _.groupBy(result, 'metaGroupId');
  //
  // const allDepartments = shopHelper.getDepartmentsFromObjects(groupedResult, path);

  // const filteredDepartments = name && name !== OTHERS_DEPARTMENT
  //   ? shopHelper.secondaryFilterDepartment({
  //     allDepartments, name, excluded, path,
  //   })
  //   : shopHelper.mainFilterDepartment(allDepartments);
  //
  // const mappedDepartments = shopHelper.subdirectoryMap({
  //   filteredDepartments,
  //   allDepartments: groupedResult,
  //   excluded,
  //   path,
  // });

  const mapped = result.map((el) => ({
    ...el,
    subdirectory: el.objectsCount > 20,
  }));

  const orderedDepartments = shopHelper.orderBySubdirectory(mapped);

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

  // if (!name && uncategorized.length) {
  //   orderedDepartments.push({
  //     name: UNCATEGORIZED_DEPARTMENT,
  //     subdirectory: false,
  //   });
  // }

  await setCachedData({
    key, data: { result: orderedDepartments }, ttl: TTL_TIME.THIRTY_MINUTES,
  });

  return { result: orderedDepartments };
};

module.exports = getWobjectDepartments;
