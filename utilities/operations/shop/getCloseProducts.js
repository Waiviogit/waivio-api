const _ = require('lodash');
const { Wobj, User, Department } = require('../../../models');
const {
  FIELDS_NAMES, REMOVE_OBJ_STATUSES, REQUIREDFILDS_WOBJ_LIST, OBJECT_TYPES,
} = require('../../../constants/wobjectsData');
const wObjectHelper = require('../../helpers/wObjectHelper');
const campaignsV2Helper = require('../../helpers/campaignsV2Helper');
const shopHelper = require('../../helpers/shopHelper');
const { SELECT_USER_CAMPAIGN_SHOP } = require('../../../constants/usersData');
const { checkForSocialSite } = require('../../helpers/sitesHelper');
const { processAppAffiliate } = require('../affiliateProgram/processAffiliate');
const { getAppAuthorities } = require('../../helpers/appHelper');

const searchObjectTypes = [OBJECT_TYPES.PRODUCT, OBJECT_TYPES.BOOK, OBJECT_TYPES.RECIPE];

const getDepartments = async ({ authorPermlink, app, locale }) => {
  const emptyDepartments = {
    departments: [],
    related: [],
    similar: [],
  };
  const { result, error } = await Wobj
    .findOne({
      author_permlink: authorPermlink,
      object_type: { $in: searchObjectTypes },
    });
  if (!result || error) return emptyDepartments;

  const object = await wObjectHelper.processWobjects({
    wobjects: [result],
    fields: [FIELDS_NAMES.DEPARTMENTS, FIELDS_NAMES.RELATED, FIELDS_NAMES.SIMILAR],
    app,
    returnArray: false,
    locale,
  });

  const names = _.map(object?.departments, 'body');

  const related = _.chain(object?.related).orderBy(['_id'], ['asc']).map('body').value();
  const similar = _.chain(object?.similar).orderBy(['_id'], ['asc']).map('body').value();

  const { result: departments } = await Department.find({ filter: { name: { $in: names } } });

  return { departments, related, similar };
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
  const { departments, related } = await getDepartments({ authorPermlink, app, locale });

  if (_.isEmpty(departments) && _.isEmpty(related)) return { wobjects: [], hasMore: false };

  const response = [];

  const social = checkForSocialSite(app?.parentHost ?? '');
  const authorities = getAppAuthorities(app);

  const { wobjects: relatedObjects = [] } = await Wobj.fromAggregation([
    {
      $match: {
        author_permlink: { $in: related },
        ...(social && { 'authority.administrative': { $in: authorities } }),
      },
    },
    { $addFields: { __order: { $indexOfArray: [related, '$author_permlink'] } } },
    { $sort: { __order: 1 } },
    { $limit: limit + 1 },
  ]);

  response.push(...relatedObjects.slice(skip, skip + limit + 1));
  if (!departments.length && !response.length) return { wobjects: [], hasMore: false };

  const metaGroupId = _.compact(_.map(response, 'metaGroupId'));

  if (response.length < limit + 1) {
    // Calculate the average objectsCount
    const totalObjectsCount = departments.reduce((sum, obj) => sum + obj.objectsCount, 0);
    const averageObjectsCount = totalObjectsCount / departments.length;

    // Filter the objects array by objectsCount greater than averageObjectsCount
    const filteredObjects = departments.filter((obj) => obj.objectsCount >= averageObjectsCount);

    const wobjects = await getObjects({
      skip: skip ? skip - (relatedObjects.length - response.length) : skip,
      limit: (limit + 1) - response.length,
      matchCondition: {
        departments: { $in: _.map(filteredObjects, 'name') },
        'status.title': { $nin: REMOVE_OBJ_STATUSES },
        author_permlink: { $nin: [authorPermlink, ...related] },
        ...(metaGroupId.length && { metaGroupId: { $nin: metaGroupId } }),
        ...(social && { 'authority.administrative': { $in: authorities } }),
      },
    });
    response.push(...wobjects);
  }

  const { user } = await User.getOne(userName, SELECT_USER_CAMPAIGN_SHOP);
  await campaignsV2Helper.addNewCampaignsToObjects({ user, wobjects: response });

  const affiliateCodes = await processAppAffiliate({
    app,
    locale,
  });

  const processed = await wObjectHelper.processWobjects({
    wobjects: response,
    fields: REQUIREDFILDS_WOBJ_LIST,
    app,
    returnArray: true,
    locale,
    countryCode,
    reqUserName: userName,
    affiliateCodes,
  });

  return {
    wobjects: _.take(processed, limit),
    hasMore: response.length > limit,
  };
};

const getSimilar = async ({
  authorPermlink, userName, app, locale, countryCode, skip, limit,
}) => {
  const { departments, similar } = await getDepartments({ authorPermlink, app, locale });

  if (_.isEmpty(departments) && _.isEmpty(similar)) return { wobjects: [], hasMore: false };

  const social = checkForSocialSite(app?.parentHost ?? '');
  const authorities = getAppAuthorities(app);

  const objectsForResponse = [];

  const { wobjects: similarObjects = [] } = await Wobj.fromAggregation([
    {
      $match: {
        author_permlink: { $in: similar },
        ...(social && { 'authority.administrative': { $in: authorities } }),
      },
    },
    { $addFields: { __order: { $indexOfArray: [similar, '$author_permlink'] } } },
    { $sort: { __order: 1 } },
    { $limit: limit + 1 },
  ]);

  objectsForResponse.push(...similarObjects.slice(skip, skip + limit + 1));
  if (!departments.length && !objectsForResponse.length) return { wobjects: [], hasMore: false };

  const metaGroupId = _.compact(_.map(objectsForResponse, 'metaGroupId'));

  const sorted = _.orderBy(departments, ['objectsCount'], ['asc']);
  const usedDepartments = [];

  let updatedLimit = objectsForResponse.length
    ? (limit + 1) - objectsForResponse.length
    : limit + 1;
  let updatedSkip = objectsForResponse.length
    ? skip - (similarObjects.length - objectsForResponse.length)
    : skip;

  for (const sortedElement of sorted) {
    if (objectsForResponse.length >= limit + 1) break;
    const matchCondition = {
      $and: [
        { author_permlink: { $nin: [authorPermlink, ...similar] } },
        { departments: sortedElement.name },
        { departments: { $nin: usedDepartments } },
      ],
      'status.title': { $nin: REMOVE_OBJ_STATUSES },
      ...(metaGroupId.length && { metaGroupId: { $nin: metaGroupId } }),
      ...(social && { 'authority.administrative': { $in: authorities } }),
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
  }

  const { user } = await User.getOne(userName, SELECT_USER_CAMPAIGN_SHOP);
  await campaignsV2Helper.addNewCampaignsToObjects({ user, wobjects: objectsForResponse });

  const affiliateCodes = await processAppAffiliate({
    app,
    locale,
  });

  const processed = await wObjectHelper.processWobjects({
    wobjects: objectsForResponse,
    fields: REQUIREDFILDS_WOBJ_LIST,
    app,
    returnArray: true,
    locale,
    countryCode,
    reqUserName: userName,
    affiliateCodes,
  });

  return {
    wobjects: _.take(processed, limit),
    hasMore: objectsForResponse.length > limit,
  };
};

const getAddOn = async ({
  authorPermlink, userName, app, locale, countryCode, skip, limit,
}) => {
  const { result, error } = await Wobj
    .findOne({
      author_permlink: authorPermlink,
      object_type: { $in: searchObjectTypes },
    });
  if (!result || error) return { wobjects: [], hasMore: false };

  const object = await wObjectHelper.processWobjects({
    wobjects: [result],
    fields: [FIELDS_NAMES.ADD_ON],
    app,
    returnArray: false,
    locale,
  });

  const permlinks = _.map(object?.addOn, 'body');

  const social = checkForSocialSite(app?.parentHost ?? '');
  const authorities = getAppAuthorities(app);

  const { wobjects: similarObjects = [] } = await Wobj.fromAggregation([
    {
      $match: {
        $or: [
          { author_permlink: { $in: permlinks } },
          { fields: { $elemMatch: { name: FIELDS_NAMES.ADD_ON, body: authorPermlink } } },
        ],
        ...(social && { 'authority.administrative': { $in: authorities } }),
        'status.title': { $nin: REMOVE_OBJ_STATUSES },
      },
    },
    { $addFields: { __order: { $indexOfArray: [permlinks, '$author_permlink'] } } },
    { $sort: { __order: 1 } },
    { $skip: skip },
    { $limit: limit + 1 },
  ]);

  const { user } = await User.getOne(userName, SELECT_USER_CAMPAIGN_SHOP);
  await campaignsV2Helper.addNewCampaignsToObjects({ user, wobjects: similarObjects });

  const affiliateCodes = await processAppAffiliate({
    app,
    locale,
  });

  const processed = await wObjectHelper.processWobjects({
    wobjects: similarObjects,
    fields: REQUIREDFILDS_WOBJ_LIST,
    app,
    returnArray: true,
    locale,
    countryCode,
    reqUserName: userName,
    affiliateCodes,
  });

  return {
    wobjects: _.take(processed, limit),
    hasMore: similarObjects.length > limit,
  };
};

module.exports = {
  getRelated,
  getSimilar,
  getAddOn,
};
