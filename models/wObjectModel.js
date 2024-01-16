const {
  FIELDS_NAMES, REMOVE_OBJ_STATUSES, STATUSES, FAVORITES_OBJECT_TYPES,
} = require('constants/wobjectsData');
const { AGGREGATION_MAX_TIME } = require('constants/common');
const WObjectModel = require('database').models.WObject;

const _ = require('lodash');

const getOne = async (authorPermlink, objectType, unavailable) => {
  try {
    const matchStage = { author_permlink: authorPermlink };
    if (unavailable) matchStage['status.title'] = { $nin: REMOVE_OBJ_STATUSES };
    if (objectType) matchStage.object_type = objectType;
    const wObject = await WObjectModel.findOne(matchStage, { search: 0, departments: 0 }).lean();

    if (!wObject) {
      return { error: { status: 404, message: 'wobject not found' } };
    }
    return { wObject };
  } catch (error) {
    return { error };
  }
};

const fromAggregation = async (pipeline) => {
  try {
    const wobjects = await WObjectModel.aggregate([...pipeline])
      .option({ maxTimeMS: AGGREGATION_MAX_TIME })
      .allowDiskUse(true);

    if (!wobjects || _.isEmpty(wobjects)) {
      return { error: { status: 404, message: 'Wobjects not found!' } };
    }
    return { wobjects };
  } catch (error) {
    return { error };
  }
};

// eslint-disable-next-line camelcase
const isFieldExist = async ({ author_permlink, fieldName }) => {
  try {
    const wobj = await WObjectModel.findOne({ author_permlink, 'fields.name': fieldName }).lean();

    return !!wobj;
  } catch (error) {
    return { error };
  }
};

const getByField = async ({ fieldName, fieldBody }) => {
  try {
    const wobjects = await WObjectModel.find({
      'fields.name': fieldName,
      'fields.body': fieldBody,
      'status.title': { $nin: REMOVE_OBJ_STATUSES },
    }).lean();

    if (_.isEmpty(wobjects)) return { error: { status: 404, message: 'Wobjects not found!' } };
    return { wobjects };
  } catch (error) {
    return { error };
  }
};

// method for redis restore wobjects author and author_permlink
const getWobjectsRefs = async () => {
  try {
    return {
      wobjects: await WObjectModel.aggregate([
        { $project: { _id: 0, author_permlink: 1, author: 1 } },
      ]),
    };
  } catch (error) {
    return { error };
  }
};

// method for redis restore fields author and author_permlink
const getFieldsRefs = async (authorPermlink) => {
  try {
    return {
      fields: await WObjectModel.aggregate([
        { $match: { authorPermlink } },
        { $unwind: '$fields' },
        { $addFields: { field_author: '$fields.author', field_permlink: '$fields.permlink' } },
        { $project: { _id: 0, field_author: 1, field_permlink: 1 } },
      ]),
    };
  } catch (error) {
    return { error };
  }
};

const findOne = async (
  condition,
  select = { search: 0, departments: 0 },
  sort,
) => {
  try {
    return { result: await WObjectModel.findOne(condition, select).sort(sort).lean() };
  } catch (error) {
    return { error };
  }
};

const find = async (
  condition,
  select,
  sort = {},
  skip = 0,
  limit,
) => {
  try {
    return {
      result: await WObjectModel
        .find(condition, select)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
    };
  } catch (error) {
    return { error };
  }
};

const findObjects = async ({
  filter,
  projection = { search: 0, departments: 0 },
  options = {},
}) => {
  try {
    return { result: await WObjectModel.find(filter, projection, options).lean() };
  } catch (error) {
    return { error };
  }
};

const countWobjectsByArea = async ({
  objectType, cities, crucialWobjects,
}) => {
  try {
    if (_.isEmpty(cities)) return { error: { status: 404, message: 'Cities not specified!' } };
    const result = await Promise.all(cities.map(async (city) => {
      const matchCond = {
        $match: {
          $and: [
            { fields: { $elemMatch: { name: FIELDS_NAMES.ADDRESS, body: { $regex: _.get(city, 'city', ''), $options: 'i' } } } },
            { object_type: objectType },
          ],
          'status.title': { $nin: REMOVE_OBJ_STATUSES },
        },
      };
      if (!_.isEmpty(crucialWobjects)) matchCond.$match.author_permlink = { $in: crucialWobjects };
      const wobject = await WObjectModel.aggregate([matchCond, { $count: 'count' }]);
      return { ...city, counter: _.get(wobject[0], 'count', 0) };
    }));
    return { result };
  } catch (error) {
    return { error };
  }
};

const getWobjectsByGroupId = async (groupId) => {
  const { result } = await findObjects({
    filter: {
      fields: {
        $elemMatch: {
          name: FIELDS_NAMES.GROUP_ID,
          body: { $in: groupId },
        },
      },
    },
    projection: {
      search: 0,
    },
  });
  if (!result) return [];
  return result;
};

const findRelistedObjectsByPermlink = async (authorPermlink) => {
  const { result } = await findObjects({
    filter: {
      'status.title': STATUSES.RELISTED,
      'status.link': authorPermlink,
    },
    projection: {
      search: 0,
    },
  });
  if (!result) return [];
  return result;
};

const getFavoritesListByUsername = async ({ userName }) => {
  try {
    const result = await WObjectModel.aggregate(
      [
        {
          $match: {
            'authority.administrative': userName,
            object_type: { $in: FAVORITES_OBJECT_TYPES },
            'status.title': { $nin: REMOVE_OBJ_STATUSES },
          },
        },
        {
          $group: {
            _id: null,
            objectTypes: { $addToSet: '$object_type' },
          },
        },
      ],
    );
    return {
      result: result[0]?.objectTypes ?? [],
    };
  } catch (error) {
    return { error };
  }
};

const getFavoritesByUsername = async ({
  userName, skip, limit, objectType,
}) => {
  try {
    const result = await WObjectModel.find(
      {
        'authority.administrative': userName,
        ...(objectType && { object_type: objectType }),
        'status.title': { $nin: REMOVE_OBJ_STATUSES },
      },
      {},
      {
        sort: { weight: -1 },
        skip,
        limit,
      },
    ).lean();
    return { result };
  } catch (error) {
    return { error };
  }
};

module.exports = {
  countWobjectsByArea,
  fromAggregation,
  getWobjectsRefs,
  getFieldsRefs,
  isFieldExist,
  getByField,
  findOne,
  getOne,
  find,
  findObjects,
  getWobjectsByGroupId,
  findRelistedObjectsByPermlink,
  getFavoritesListByUsername,
  getFavoritesByUsername,
};
