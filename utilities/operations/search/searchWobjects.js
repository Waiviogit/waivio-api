const { Wobj, App } = require( '../../../models' );
const _ = require( 'lodash' );
const { REQUIREFIELDS_PARENT, REQUIREFIELDS_SEARCH } = require( '../../constants' );

const makePipeline = ( { string, object_type, limit, skip, crucial_wobjects, forParent, required_fields } ) => {
    return [
        {
            $match: {
                $and: [
                    {
                        $or: [
                            // search matching in every "name" field
                            { 'fields': { $elemMatch: { 'name': 'name', 'body': { $regex: `\\b${string}.*\\b`, $options: 'i' } } } },
                            // if 4-th symbol is "-" - search by "author_permlink" too
                            { 'author_permlink': { $regex: `${_.get( string, '[3]' ) === '-' ? '^' + string : '_'}`, $options: 'i' } }
                        ]
                    },
                    { object_type: { $regex: `^${object_type || '.*'}$`, $options: 'i' } }
                ]
            }
        },
        {
            $addFields: {
                crucial_wobject: { $cond: { if: { $in: [ '$author_permlink', crucial_wobjects ] }, then: 1, else: 0 } },
                priority: { $cond: { if: { $eq: [ '$parent', forParent ] }, then: 1, else: 0 } }
            }
        },
        { $sort: { crucial_wobject: -1, priority: -1, weight: -1 } },
        { $limit: limit || 10 },
        { $skip: skip || 0 },
        {
            $addFields: {
                'fields': {
                    $filter: {
                        input: '$fields',
                        as: 'field',
                        cond: {
                            $in: [ '$$field.name', _.union( REQUIREFIELDS_SEARCH, required_fields || [] ) ]
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

exports.searchWobjects = async ( { string, object_type, limit, skip, sortByApp, forParent, required_fields } ) => {
    // get count of wobjects grouped by object_types
    const { wobjects: wobjectsCounts, error: getWobjCountError } = await Wobj.fromAggregation( makeCountPipeline( { string } ) );
    let crucial_wobjects = [];

    if( sortByApp ) {
        // change priority for some wobjects by specified App
        const { app } = await App.getOne( { name: sortByApp } );

        crucial_wobjects = _.get( app, 'supported_objects' );
    }
    // get wobjects
    const { wobjects = [], error: getWobjError } = await Wobj.fromAggregation( makePipeline( { string, object_type, limit, skip, crucial_wobjects, forParent, required_fields } ) );

    return { wobjects, wobjectsCounts, error: getWobjCountError || getWobjError };
};
