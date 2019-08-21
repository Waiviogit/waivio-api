const { Wobj, ObjectType } = require( '../../../models' );
const { REQUIREDFIELDS, REQUIREFIELDS_PARENT } = require( '../../constants' );
const _ = require( 'lodash' );

// latitude must be an number in range -90..90, longitude in -180..180, radius - positive number
const getMapCondition = async ( { latitude, longitude, radius = 1000 } ) => {
    if ( !latitude || !longitude ) {
        return { error: { status: 422, message: 'Latitude and Longitude must exist!' } };
    } else if ( latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180 ) {
        return { error: { status: 422, message: 'Latitude and Longitude must be in correct range!' } };
    } else if ( radius < 0 ) {
        return { error: { status: 422, message: 'Radius must be positive number!' } };
    }
    const aggrCondition = [
        {
            $geoNear: {
                near: { type: 'Point', coordinates: [ longitude, latitude ] },
                distanceField: 'distance',
                maxDistance: radius,
                spherical: true
            }
        }
    ];

    return { aggrCondition };
};

const validateInput = ( filter ) => {
    if ( filter ) {
        if ( filter.map ) {
            if ( !filter.map.coordinates || !Array.isArray( filter.map.coordinates ) || filter.map.coordinates.length !== 2 || !filter.map.radius ) {
                return false;
            }
        }
    }
    return true;
};

const getWobjWithFilters = async ( { objectType, filter, limit = 30, skip = 0, sortBy = 'weight' } ) => {
    const aggregationPipeline = [];

    if ( !validateInput( filter ) ) {
        return { error: { status: 422, message: 'Filter is not valid!' } };
    }
    if ( filter && filter.map ) {
        const { aggrCondition: mapCond, error: mapError } = await getMapCondition( {
            latitude: filter.map.coordinates[ 0 ],
            longitude: filter.map.coordinates[ 1 ],
            radius: filter.map.radius
        } );

        if ( mapError ) return { error: mapError };
        aggregationPipeline.push( ...mapCond );
    }
    aggregationPipeline.push( {
        $match: {
            object_type: objectType
        }
    } );
    // ///////////////////////////// ///
    // place here additional filters ///
    // ///////////////////////////// ///
    aggregationPipeline.push(
        { $sort: sortBy === 'weight' ? { weight: -1 } : { distance: -1 } },
        { $skip: skip },
        { $limit: limit },
        { $addFields: { 'fields': { $filter: { input: '$fields', as: 'field', cond: { $in: [ '$$field.name', REQUIREDFIELDS ] } } } } },
        { $lookup: { from: 'wobjects', localField: 'parent', foreignField: 'author_permlink', as: 'parent' } },
        { $unwind: { path: '$parent', preserveNullAndEmptyArrays: true } } );
    const { wobjects, error: aggrError } = await Wobj.fromAggregation( aggregationPipeline );

    if( aggrError ) {
        if( aggrError.status === 404 ) {
            return { wobjects: [] };
        }
        return { error: aggrError };
    }
    return { wobjects };
};

module.exports = async ( { name, filter, wobjLimit, wobjSkip } ) => {
    const { objectType, error: objTypeError } = await ObjectType.getOne( { name: name } );

    if( objTypeError ) return { error: objTypeError };
    const { wobjects, error: wobjError } = await getWobjWithFilters( { objectType: name, filter, limit: wobjLimit + 1, skip: wobjSkip } );

    if( wobjError ) return { error: wobjError };
    if( objectType.related_wobjects.length === wobjLimit + 1 ) {
        objectType.hasMoreWobjects = true;
        objectType.related_wobjects = objectType.related_wobjects.slice( 0, wobjLimit );
    }
};
