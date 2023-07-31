const { Wobj, User } = require('models');
const {
  FIELDS_NAMES, REMOVE_OBJ_STATUSES, OBJECT_TYPES, DEFAULT_LINK_FIELDS, REQUIREDFILDS_WOBJ_LIST,
} = require('constants/wobjectsData');
const { wObjectHelper } = require('utilities/helpers');
const { ERROR_OBJ } = require('constants/common');
const { SELECT_USER_CAMPAIGN_SHOP } = require('constants/usersData');
const campaignsV2Helper = require('utilities/helpers/campaignsV2Helper');
const _ = require('lodash');
const shopHelper = require('utilities/helpers/shopHelper');
const { processAppAffiliate } = require('../affiliateProgram/processAffiliate');

const BUSINESS_FIELDS = [
  FIELDS_NAMES.MERCHANT, FIELDS_NAMES.MANUFACTURER, FIELDS_NAMES.BRAND, FIELDS_NAMES.PUBLISHER,
];
const PERSON_FIELDS = [FIELDS_NAMES.AUTHORS];

const REFERENCE_TYPES = {
  person: [
    OBJECT_TYPES.BOOK,
  ],
  business: [
    OBJECT_TYPES.PRODUCT,
    OBJECT_TYPES.BOOK,
  ],
};

const ALLOWED_OBJ_TYPES_FOR_REFERENCE_SEARCH = [
  OBJECT_TYPES.BUSINESS,
  OBJECT_TYPES.PERSON,
];

const validateTypeToReference = (type) => ALLOWED_OBJ_TYPES_FOR_REFERENCE_SEARCH.includes(type);

const filterCondition = ({ authorPermlink, referenceObjectType, fieldNames }) => ({
  object_type: referenceObjectType,
  'status.title': { $nin: REMOVE_OBJ_STATUSES },
  fields: {
    $elemMatch: {
      name: { $in: fieldNames },
      body: { $regex: authorPermlink },
      weight: { $gt: 0 },
    },
  },
});

const makeFilterByType = ({ authorPermlink, objectType, referenceObjectType }) => {
  const types = {
    business: filterCondition({
      authorPermlink,
      referenceObjectType,
      fieldNames: BUSINESS_FIELDS,
    }),
    person: filterCondition({
      authorPermlink,
      referenceObjectType,
      fieldNames: PERSON_FIELDS,
    }),
  };

  return types[objectType];
};

const getAll = async ({
  authorPermlink, app, locale, countryCode,
}) => {
  const { result, error } = await Wobj
    .findOne({ author_permlink: authorPermlink }, { object_type: 1 });

  if (error) return { error };
  if (!result) return { error: ERROR_OBJ.NOT_FOUND };
  if (!validateTypeToReference(result?.object_type)) return { error: ERROR_OBJ.UNPROCESSABLE };

  const referenceTypes = REFERENCE_TYPES[result.object_type] ?? [];

  const referenceObject = {};

  for (const referenceObjectType of referenceTypes) {
    const { wobjects } = await Wobj.fromAggregation([
      {
        $match: {
          ...makeFilterByType({
            authorPermlink,
            objectType: result?.object_type,
            referenceObjectType,
          }),
        },
      },
      ...shopHelper.getDefaultGroupStage(),
      { $limit: 5 },
    ]);
    if (!wobjects?.length) continue;
    const affiliateCodes = await processAppAffiliate({
      countryCode,
      app,
      locale,
    });

    referenceObject[referenceObjectType] = await wObjectHelper.processWobjects({
      wobjects,
      fields: [
        FIELDS_NAMES.NAME,
        FIELDS_NAMES.AVATAR,
        ...DEFAULT_LINK_FIELDS,
        FIELDS_NAMES.RATING,
        FIELDS_NAMES.PRICE,
      ],
      app,
      returnArray: true,
      locale,
      affiliateCodes,
    });
  }

  return { result: referenceObject };
};

const getByType = async ({
  authorPermlink, referenceObjectType, app, userName, locale, skip, limit, countryCode,
}) => {
  const { result, error } = await Wobj
    .findOne({ author_permlink: authorPermlink }, { object_type: 1 });

  if (error) return { error };
  if (!result) return { error: ERROR_OBJ.NOT_FOUND };
  if (!validateTypeToReference(result?.object_type)) return { error: ERROR_OBJ.UNPROCESSABLE };

  const { wobjects } = await Wobj.fromAggregation([
    {
      $match: {
        ...makeFilterByType({
          authorPermlink,
          objectType: result?.object_type,
          referenceObjectType,
        }),
      },
    },
    ...shopHelper.getDefaultGroupStage(),
    { $skip: skip },
    { $limit: limit + 1 },
  ]);

  const { user } = await User.getOne(userName, SELECT_USER_CAMPAIGN_SHOP);
  await campaignsV2Helper.addNewCampaignsToObjects({ user, wobjects });

  const processed = await wObjectHelper.processWobjects({
    wobjects,
    fields: REQUIREDFILDS_WOBJ_LIST,
    app,
    returnArray: true,
    locale,
    countryCode,
    reqUserName: userName,
  });

  return {
    wobjects: _.take(processed, limit),
    hasMore: wobjects.length > limit,
  };
};

module.exports = {
  getAll,
  getByType,
};
