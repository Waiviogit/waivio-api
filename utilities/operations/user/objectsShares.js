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


const getUserObjectsShares = async ( data ) => {

    const { result: wobjects, error: userWobjectsError } = await UserWobjects.aggregate( makePipeline( data ) );

    if ( userWobjectsError ) {
        return { error: userWobjectsError };
    }

    let required_fields = [ ...REQUIREDFIELDS ];
    const fields = required_fields.map( ( item ) => ( { name: item } ) );

    wobjects.forEach( ( wObject ) => {
        wObjectHelper.formatRequireFields( wObject, data.locale, fields );
    } );
    await rankHelper.calculateForUserWobjects( wobjects, true );
    const { count: wobjects_count, error } = await UserWobjects.countDocuments( { user_name: data.name } );

    if ( error ) {
        return { error };
    }

    return { objects_shares: { wobjects, wobjects_count } };
};

module.exports = { getUserObjectsShares };

