const { Wobj, ObjectType } = require( '../../../models' );
const { REQUIREDFIELDS, REQUIREFIELDS_PARENT } = require( '../../constants' );
const _ = require( 'lodash' );

// // latitude must be an number in range -90..90, longitude in -180..180, radius - positive number
// const getMapCondition = async ( { latitude, longitude, radius = 1000 } ) => {
//     const aggrCondition = [
//         {
//             $geoNear: {
//                 near: { type: 'Point', coordinates: [ longitude, latitude ] },
//                 distanceField: 'proximity',
//                 maxDistance: radius,
//                 spherical: true
//             }
//         }
//     ];
//
//     return { aggrCondition };
// };

const validateInput = ( { filter, sort } ) => {
    if ( filter ) {
        // validate map filter
        if ( filter.map ) {
            if ( !filter.map.coordinates || !Array.isArray( filter.map.coordinates ) || filter.map.coordinates.length !== 2 || !filter.map.radius ) {
                return false;
            }
        }
        // ///////////////////////////////// //
        // validate another specific filters //
        // ///////////////////////////////// //
    }
    if( sort ) {
        if ( sort === 'proximity' && !_.get( filter, 'map' ) ) return false;
    }
    return true;
};

const getWobjWithFilters = async ( { objectType, filter, limit = 30, skip = 0, sort = 'weight' } ) => {
    const aggregationPipeline = [];

    if ( !validateInput( { filter, sort } ) ) {
        return { error: { status: 422, message: 'Filter or Sort param is not valid!' } };
    }

    if ( filter && filter.map ) {
        aggregationPipeline.push( {
            $geoNear: {
                near: { type: 'Point', coordinates: [ filter.map.coordinates[ 1 ], filter.map.coordinates[ 0 ] ] },
                distanceField: 'proximity',
                maxDistance: filter.map.radius,
                spherical: true
            }
        } );
        delete filter.map;
    }
    aggregationPipeline.push( {
        $match: {
            object_type: objectType
        }
    } );
    if( !_.isEmpty( filter ) ) {
        // ///////////////////////////// ///
        // place here additional filters ///
        // ///////////////////////////// ///
        for( const filterItem in filter ) {
            for( const filterValue of filter[ filterItem ] ) {
                aggregationPipeline.push(
                    { $match: { fields: { $elemMatch: { name: filterItem, body: filterValue } } } }
                );
            }
        }
    }
    aggregationPipeline.push(
        { $sort: { [ sort ]: -1 } },
        { $skip: skip },
        { $limit: limit },
        { $addFields: { 'fields': { $filter: { input: '$fields', as: 'field', cond: { $in: [ '$$field.name', REQUIREDFIELDS ] } } } } },
        { $lookup: { from: 'wobjects', localField: 'parent', foreignField: 'author_permlink', as: 'parent' } },
        { $unwind: { path: '$parent', preserveNullAndEmptyArrays: true } } );
    // get wobjects by pipeline
    const { wobjects, error: aggrError } = await Wobj.fromAggregation( aggregationPipeline );

    if( aggrError ) {
        if( aggrError.status === 404 ) return { wobjects: [] };
        return { error: aggrError };
    }
    return { wobjects };
};

module.exports = async ( { name, filter, wobjLimit, wobjSkip, sort } ) => {
    const { objectType, error: objTypeError } = await ObjectType.getOne( { name: name } );

    if( objTypeError ) return { error: objTypeError };
    const { wobjects, error: wobjError } = await getWobjWithFilters( { objectType: name, filter, limit: wobjLimit + 1, skip: wobjSkip, sort } );

    if( wobjError ) return { error: wobjError };
    objectType.related_wobjects = wobjects;
    if( objectType.related_wobjects.length === wobjLimit + 1 ) {
        objectType.hasMoreWobjects = true;
        objectType.related_wobjects = objectType.related_wobjects.slice( 0, wobjLimit );
    }
    return { objectType };
};
