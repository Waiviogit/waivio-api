const {ObjectType} = require('../database').models;

const getAll = async ({limit, skip}) => {
    try {
        const objectTypes = await ObjectType.aggregate([
            {$skip: skip},
            {$limit: limit}
        ]);
        return {objectTypes}
    } catch (e) {
        return {error: e}
    }
};

const search = async ({string, limit, skip}) => {
    try {
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

module.exports = {getAll, search}