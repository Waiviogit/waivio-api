const { Wobj } = require( '../../../models' );
const { rankHelper } = require( '../../helpers' );
const _ = require( 'lodash' );
const { REQUIREDFIELDS, REQUIREFIELDS_PARENT } = require( '../../constants' );

const makePipeline = ( { string, object_type, limit, skip } ) => {
    return [
        {
            $match: {
                $and: [ {
                    $or: [ {
                        'fields':
                            {
                                $elemMatch: {
                                    'name': 'name',
                                    'body': { $regex: `\\b${string}.*\\b`, $options: 'i' }
                                }
                            }
                    },
                    { // if 4-th symbol is "-" - search by "author_permlink" too
                        'author_permlink': { $regex: `${_.get( string, '[3]' ) === '-' ? '^' + string : '_'}`, $options: 'i' }
                    } ]
                }, {
                    object_type: { $regex: `^${object_type || '.+'}$`, $options: 'i' }
                } ]
            }
        },
        { $sort: { weight: -1 } },
        { $limit: limit || 10 },
        { $skip: skip || 0 },
        {
            $addFields: {
                'fields': {
                    $filter: {
                        input: '$fields',
                        as: 'field',
                        cond: {
                            $in: [ '$$field.name', REQUIREDFIELDS ]
                        }
                    }
                }
            }
        },
        {
            $lookup: {
                from: 'wobjects',
                localField: 'parent',
                foreignField: 'author_permlink',
                as: 'parent'
            }
        },
        { $unwind: { path: '$parent', preserveNullAndEmptyArrays: true } }
    ];
};
const makeCountPipeline = ( { string } ) => {
    return [
        {
            $match: {
                $or: [
                    { 'fields': { $elemMatch: { 'name': 'name', 'body': { $regex: `\\b${string}.*\\b`, $options: 'i' } } } },
                    { 'author_permlink': { $regex: `${_.get( string, '[3]' ) === '-' ? '^' + string : '_'}`, $options: 'i' } }
                ]
            }
        },
        { $group: { _id: '$object_type', count: { $sum: 1 } } },
        { $project: { _id: 0, object_type: '$_id', count: 1 } }
    ];
};
const formatWobjects = async ( wObjects ) => {
    wObjects.forEach( ( wobject ) => {
        wobject.fields = wobject.fields.filter( ( item ) => REQUIREFIELDS_PARENT.includes( item.name ) );
    } );
    await rankHelper.calculateWobjectRank( wObjects ); // calculate rank for wobjects
};

exports.searchWobjects = async ( { string, object_type, limit, skip } ) => {
    const { wobjects: wobjectsCounts, error: getWobjCountError } = await Wobj.fromAggregation( makeCountPipeline( { string } ) );
    const { wobjects = [], error: getWobjError } = await Wobj.fromAggregation( makePipeline( { string, object_type, limit, skip } ) );

    await formatWobjects( wobjects );
    return { wobjects, wobjectsCounts, error: getWobjCountError || getWobjError };
};
