const { Wobj, ObjectType } = require( '../../../models' );
const { REQUIREDFIELDS, LOW_PRIORITY_STATUS_FLAGS } = require( '../../constants' );
const _ = require( 'lodash' );

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
                let cond = { $match: { fields: { $elemMatch: { name: filterItem, body: filterValue } } } };
                // additional filter for field "rating"
                if( filterItem === 'rating' ) {
                    cond.$match.fields.$elemMatch.rating_votes = { $exists: true, $not: { $size: 0 } };
                }
                aggregationPipeline.push( cond );
            }
        }
    }
    aggregationPipeline.push(
        {
            $addFields: {
                priority: {
                    $cond: {
                        if: { $in: [ '$status.title', LOW_PRIORITY_STATUS_FLAGS ] },
                        then: 0, else: 1
                    }
                }
            }
        },
        { $sort: { priority: -1, [ sort ]: -1, _id: -1 } },
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
