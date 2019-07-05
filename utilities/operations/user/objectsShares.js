const UserWobjects = require( '../../../models/UserWobjects' );
const { REQUIREDFIELDS } = require( '../../constants' );
const { wObjectHelper, rankHelper } = require( '../../helpers' );

const makePipeline = ( { name, skip, limit, object_types, exclude_object_types } ) => {
    let pipeline = [
        { $match: { user_name: name } },
        { $sort: { weight: -1 } },
        {
            $lookup: {
                from: 'wobjects',
                localField: 'author_permlink',
                foreignField: 'author_permlink',
                as: 'wobject'
            }
        },
        { $unwind: '$wobject' },
        { $skip: skip },
        { $limit: limit },
        {
            $addFields: {
                'wobject.user_weight': '$weight'
            }
        },
        { $replaceRoot: { newRoot: '$wobject' } }
    ];

    if( object_types || exclude_object_types ) {
        pipeline.splice( 4, 0, {
            $match: { 'wobject.object_type': object_types ? { $in: object_types } : { $nin: exclude_object_types } }
        } );
    }
    return pipeline;
};

const makeCountPipeline = ( { name, object_types, exclude_object_types } ) => {
    let pipeline = [
        { $match: { user_name: name } },
        {
            $lookup: {
                from: 'wobjects',
                localField: 'author_permlink',
                foreignField: 'author_permlink',
                as: 'wobject'
            }
        },
        { $unwind: '$wobject' },
        {
            $count: 'count'
        }
    ];

    if( object_types || exclude_object_types ) {
        pipeline.splice( 3, 0, {
            $match: { 'wobject.object_type': object_types ? { $in: object_types } : { $nin: exclude_object_types } }
        } );
    }
    return pipeline;
};


const getUserObjectsShares = async ( data ) => {

    console.time( 'GET WOBJECTS:' );
    const { result: wobjects, error: userWobjectsError } = await UserWobjects.aggregate( makePipeline( data ) );

    console.timeEnd( 'GET WOBJECTS:' );

    if ( userWobjectsError ) {
        return { error: userWobjectsError };
    }

    let required_fields = [ ...REQUIREDFIELDS ];
    const fields = required_fields.map( ( item ) => ( { name: item } ) );

    wobjects.forEach( ( wObject ) => {
        wObjectHelper.formatRequireFields( wObject, data.locale, fields );
    } );
    await rankHelper.calculateForUserWobjects( wobjects, true );
    console.time( 'GET COUNT:' );
    const { result: [ countResult ], error } = await UserWobjects.aggregate( makeCountPipeline( data ) );

    console.timeEnd( 'GET COUNT:' );

    if ( error ) {
        return { error };
    }

    return { objects_shares: { wobjects, wobjects_count: countResult.count } };
};

module.exports = { getUserObjectsShares };
