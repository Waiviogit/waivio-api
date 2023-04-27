const { Wobj, User, Department } = require('models');
const {
  FIELDS_NAMES, REMOVE_OBJ_STATUSES, OBJECT_TYPES, DEFAULT_LINK_FIELDS, REQUIREDFIELDS,
} = require('constants/wobjectsData');
const wObjectHelper = require('utilities/helpers/wObjectHelper');
const _ = require('lodash');
const { ERROR_OBJ } = require('constants/common');
const campaignsV2Helper = require('utilities/helpers/campaignsV2Helper');
const shopHelper = require('../../helpers/shopHelper');
const { SELECT_USER_CAMPAIGN_SHOP } = require('../../../constants/usersData');

const getDepartments = async ({ authorPermlink, app, locale }) => {
  const emptyDepartments = [];
  const { result, error } = await Wobj
    .findOne({ author_permlink: authorPermlink });
  if (!result || error) return emptyDepartments;

  const object = await wObjectHelper.processWobjects({
    wobjects: [result],
    fields: [FIELDS_NAMES.DEPARTMENTS],
    app,
    returnArray: false,
    locale,
  });

  const names = _.map(object?.departments, 'body');
  if (!names.length) return emptyDepartments;

  const { result: departments } = await Department.find({ filter: { name: { $in: names } } });

  return departments;
};

const getObjectsCount = async (matchCondition) => {
  const { wobjects = [] } = await Wobj.fromAggregation([
    {
      $match: matchCondition,
    },
    ...shopHelper.getDefaultGroupStage(),
    { $count: 'count' },
  ]);

  return wobjects[0]?.count ?? 0;
};

const getObjects = async ({ skip, limit, matchCondition }) => {
  const { wobjects = [] } = await Wobj.fromAggregation([
    {
      $match: matchCondition,
    },
    ...shopHelper.getDefaultGroupStage(),
    { $skip: skip },
    { $limit: limit },
  ]);
  return wobjects;
};

const getRelated = async ({
  authorPermlink, userName, app, locale, countryCode, skip, limit,
}) => {
  const departments = await getDepartments({ authorPermlink, app, locale });
  if (!departments.length) return { error: ERROR_OBJ.NOT_FOUND };

  // Calculate the average objectsCount
  const totalObjectsCount = departments.reduce((sum, obj) => sum + obj.objectsCount, 0);
  const averageObjectsCount = totalObjectsCount / departments.length;

  // Filter the objects array by objectsCount greater than averageObjectsCount
  const filteredObjects = departments.filter((obj) => obj.objectsCount > averageObjectsCount);

  const wobjects = await getObjects({
    skip,
    limit: limit + 1,
    matchCondition: {
      departments: { $in: _.map(filteredObjects, 'name') },
      'status.title': { $nin: REMOVE_OBJ_STATUSES },
      author_permlink: { $ne: authorPermlink },
    },
  });
  const { user } = await User.getOne(userName, SELECT_USER_CAMPAIGN_SHOP);
  await campaignsV2Helper.addNewCampaignsToObjects({ user, wobjects });

  const processed = await wObjectHelper.processWobjects({
    wobjects,
    fields: REQUIREDFIELDS,
    app,
    returnArray: true,
    locale,
    countryCode,
  });

  return {
    wobjects: _.take(processed, limit),
    hasMore: wobjects.length > limit,
  };
};

const getSimilar = async ({
  authorPermlink, userName, app, locale, countryCode, skip, limit,
}) => {
  const departments = await getDepartments({ authorPermlink, app, locale });
  if (!departments.length) return { error: ERROR_OBJ.NOT_FOUND };
  const objectsForResponse = [];
  const sorted = _.orderBy(departments, ['objectsCount'], ['asc']);
  const usedDepartments = [];

  let updatedLimit = limit + 1;
  let updatedSkip = skip;
  for (const sortedElement of sorted) {
    const matchCondition = {
      $and: [
        { author_permlink: { $ne: authorPermlink } },
        { departments: sortedElement.name },
        { departments: { $nin: usedDepartments } },
      ],
      'status.title': { $nin: REMOVE_OBJ_STATUSES },
    };

    const count = await getObjectsCount(matchCondition);
    if (!count) {
      usedDepartments.push(sortedElement.name);
      //
      continue;
    }
    if (count <= updatedSkip) {
      usedDepartments.push(sortedElement.name);
      updatedSkip -= count;
      continue;
    }
    const objects = await getObjects({
      skip: updatedSkip,
      limit: updatedLimit,
      matchCondition,
    });
    if (objects.length < updatedLimit) updatedLimit -= objects.length;
    objectsForResponse.push(...objects);
    usedDepartments.push(sortedElement.name);
    if (objectsForResponse.length >= limit + 1) break;
  }

  const { user } = await User.getOne(userName, SELECT_USER_CAMPAIGN_SHOP);
  await campaignsV2Helper.addNewCampaignsToObjects({ user, wobjects: objectsForResponse });

  const processed = await wObjectHelper.processWobjects({
    wobjects: objectsForResponse,
    fields: REQUIREDFIELDS,
    app,
    returnArray: true,
    locale,
    countryCode,
  });

  return {
    wobjects: _.take(processed, limit),
    hasMore: objectsForResponse.length > limit,
  };
};

module.exports = {
  getRelated,
  getSimilar,
};
