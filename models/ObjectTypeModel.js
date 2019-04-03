const {ObjectType} = require('../database').models;
const {REQUIREDFIELDS} = require('../utilities/constants');

const getAll = async ({limit, skip, wobjects_count = 3}) => {
    let objectTypes
	try {
        objectTypes = await ObjectType.aggregate([
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
						{ $limit: wobjects_count + 1 },
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
    } catch (e) {
        return {error: e}
    }
    for(const type of objectTypes){
    	if(type.related_wobjects.length === wobjects_count + 1){
    		type.hasMoreWobjects = true;
    		type.related_wobjects = type.related_wobjects.slice(0,wobjects_count)
		}
	}

	return {objectTypes}
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
