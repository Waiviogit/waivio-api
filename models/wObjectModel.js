const WObjectModel = require('database').models.WObject;
const createError = require('http-errors');
const _ = require('lodash');
const { REQUIREDFIELDS } = require('constants/wobjectsData');

const getOne = async (authorPermlink, objectType, unavailable) => {
  try {
    const matchStage = { author_permlink: authorPermlink };
    if (unavailable) matchStage['status.title'] = { $nin: ['unavailable', 'nsfw'] };
    if (objectType) matchStage.object_type = objectType;
    const wObject = await WObjectModel.findOne(matchStage).lean();

    if (!wObject) {
      return { error: createError(404, 'wobject not found') };
    }
    return { wObject };
  } catch (error) {
    return { error };
  }
};

const getAll = async (data) => {
  const findParams = {};
  const pipeline = [];
  // let hasMore = false;
  let wObjects;
  const requiredFields = [...REQUIREDFIELDS];

  if (data.required_fields.length) {
    requiredFields.push(...data.required_fields);
  }

  if (data.author_permlinks.length) {
    findParams.author_permlink = { $in: data.author_permlinks };
  }

  if (data.object_types.length) {
    findParams.object_type = { $in: data.object_types };
  } else if (data.exclude_object_types.length) {
    findParams.object_type = { $nin: data.exclude_object_types };
  }

  if (_.has(data, 'map.coordinates')) {
    pipeline.push({
      $geoNear: {
        near: { type: 'Point', coordinates: [data.map.coordinates[1], data.map.coordinates[0]] },
        distanceField: 'distance',
        maxDistance: data.map.radius ? parseInt(data.map.radius, 10) : 10000,
        spherical: true,
        limit: data.limit,
      },
    });
  }
  if (data.sample) {
    pipeline['status.title'] = { $nin: ['unavailable', 'relisted'] };
  }
  pipeline.push(...[
    { $match: findParams },
    { $sort: { weight: -1 } },
    { $skip: data.sample ? 0 : data.skip },
    { $limit: data.sample ? 100 : data.limit + 1 },
  ]);
  if (data.sample) {
    pipeline.push({ $sample: { size: 5 } });
  }
  pipeline.push(...[
    {
      $addFields: {
        fields: {
          $filter: {
            input: '$fields',
            as: 'field',
            cond: {
              $in: ['$$field.name', requiredFields],
            },
          },
        },
      },
    },
  ]);
  try {
    const { wobjects, error } = await fromAggregation(pipeline);

    if (error) {
      return { error };
    }
    wObjects = wobjects;
  } catch (error) {
    return { error };
  }
  return {
    hasMore: wObjects.length > data.limit,
    wObjectsData: wObjects.slice(0, data.limit),
  };
  // if (!wObjects || wObjects.length === 0) {
  //   return { wObjectsData: [] };
  // } if (wObjects.length === data.limit + 1) {
  //   hasMore = true;
  //   wObjects = wObjects.slice(0, data.limit);
  // }
  // return { wObjectsData: wObjects, hasMore };
};

const fromAggregation = async (pipeline) => {
  try {
    const wobjects = await WObjectModel.aggregate([...pipeline]);

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
    const wobjects = await WObjectModel.find({ 'fields.name': fieldName, 'fields.body': fieldBody }).lean();

    if (_.isEmpty(wobjects)) return { error: { status: 404, message: 'Wobjects not found!' } };
    return { wobjects };
  } catch (error) {
    return { error };
  }
};

// eslint-disable-next-line camelcase
const getChildWobjects = async ({ skip, limit, author_permlink }) => {
  try {
    const wobjects = await WObjectModel.find(
      { parent: author_permlink },
    ).sort({ weight: -1, _id: -1 }).skip(skip).limit(limit)
      .lean();

    if (_.isEmpty(wobjects)) return { wobjects: [] };
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

const findOne = async (authorPermlink) => {
  try {
    return { result: await WObjectModel.findOne({ author_permlink: authorPermlink }).lean() };
  } catch (error) {
    return { error };
  }
};

const find = async (condition, select, sort = {}) => {
  try {
    return { result: await WObjectModel.find(condition, select).sort(sort).lean() };
  } catch (error) {
    return { error };
  }
};

module.exports = {
  getAll,
  getOne,
  find,
  fromAggregation,
  isFieldExist,
  getByField,
  getChildWobjects,
  getWobjectsRefs,
  getFieldsRefs,
  findOne,
};
