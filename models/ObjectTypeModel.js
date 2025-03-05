const { ObjectType } = require('../database').models;
const { REQUIREDFIELDS } = require('../constants/wobjectsData');

const getAll = async ({ limit, skip, wobjects_count: wobjectsCount = 3 }) => {
  let objectTypes;

  try {
    objectTypes = await ObjectType.aggregate([
      { $skip: skip },
      { $limit: limit },
      {
        $lookup: {
          from: 'wobjects',
          as: 'related_wobjects',
          let: { object_type_name: '$name' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$object_type', '$$object_type_name'] },
              },
            },
            { $sort: { weight: -1 } },
            { $limit: wobjectsCount + 1 },
            {
              $addFields: {
                fields: {
                  $filter: {
                    input: '$fields',
                    as: 'field',
                    cond: {
                      $in: ['$$field.name', REQUIREDFIELDS],
                    },
                  },
                },
              },
            },
          ],
        },
      },
    ]);
  } catch (e) {
    return { error: e };
  }
  for (const type of objectTypes) {
    if (type.related_wobjects.length === wobjectsCount + 1) {
      type.hasMoreWobjects = true;
      type.related_wobjects = type.related_wobjects.slice(0, wobjectsCount);
    }
  }

  return { objectTypes };
};

const search = async ({
  string, limit = 20, skip = 0, supportedTypes,
}) => {
  try {
    if (!string) {
      return { error: { status: 422, message: 'Search string is empty' } };
    }

    const condition = { $and: [{ name: { $regex: `${string}`, $options: 'i' } }] };
    if (supportedTypes.length)condition.$and.push({ name: { $in: supportedTypes } });

    const objectTypes = await ObjectType.aggregate([
      { $match: condition },
      { $skip: skip },
      { $limit: limit },
    ]);

    return { objectTypes };
  } catch (e) {
    return { error: e };
  }
};

const getOne = async ({ name }) => {
  try {
    // const objectType = await ObjectType.findOne({name: name}).lean();
    const objectType = await ObjectType.findOne({ name }).lean();

    if (!objectType) {
      return { error: { status: 404, message: 'Object Type not found!' } };
    }
    return { objectType };
  } catch (e) {
    return { error: e };
  }
};

const aggregate = async (pipeline = []) => {
  try {
    const result = await ObjectType.aggregate(pipeline);

    if (!result) {
      return { error: { status: 404, message: 'Not found!' } };
    }
    return { result };
  } catch (error) {
    return { error };
  }
};

const find = async ({ filter, projection, options }) => {
  try {
    const result = await ObjectType.find(filter, projection, options).lean();
    return { result };
  } catch (error) {
    return { error };
  }
};

module.exports = {
  getAll, search, getOne, aggregate, find,
};
