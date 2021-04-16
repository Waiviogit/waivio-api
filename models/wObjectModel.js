const WObjectModel = require('database').models.WObject;
const createError = require('http-errors');
const _ = require('lodash');

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
const getChildWobjects = async ({
  skip, limit, authorPermlink, excludeTypes = [],
}) => {
  try {
    const wobjects = await WObjectModel
      .find({
        parent: authorPermlink,
        object_type: { $nin: excludeTypes },
        'status.title': { $nin: ['unavailable', 'nsfw'] },
      })
      .sort({ weight: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
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

const find = async (condition, select, sort = {}, skip = 0, limit) => {
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

module.exports = {
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
