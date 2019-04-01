const {ObjectType} = require('../database').models;
const {REQUIREDFIELDS} = require('../utilities/constants');

const getAll = async ({limit, skip, wobjects_count}) => {
    try {
        const objectTypes = await ObjectType.aggregate([
            {$skip: skip},
            {$limit: limit},
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
                        { $limit: wobjects_count || 3 },
                        {
                            $addFields: {
                                'fields':{
                                    $filter:{
                                        input: '$fields',
                                        as:'field',
                                        cond:{
                                            $in:['$$field.name', REQUIREDFIELDS]
                                        }
                                    }
                                }
                            }
                        }
                    ]
                }
            }
        ]);
        return {objectTypes}
    } catch (e) {
        return {error: e}
    }
};

const search = async ({string, limit, skip}) => {
    try {
        if (!string) {
            throw {status: 422, message: 'Search string is empty'};
        }
        const objectTypes = await ObjectType.aggregate([
            {$match: {name: {$regex: `${string}`, $options: 'i'}}},
            {$skip: skip},
            {$limit: limit}
        ]);
        return {objectTypes}
    } catch (e) {
        return {error: e}
    }
};

const getOne = async ({name}) => {
    try {
        const objectType = await ObjectType.findOne({name: name}).lean();
        if (!objectType) {
            throw {status: 404, message: 'Object Type not found!'}
        }
        return {objectType}
    } catch (e) {
        return {error: e}
    }
};

module.exports = {getAll, search, getOne}