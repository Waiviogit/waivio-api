const Wobj = require( '../../models/wObjectModel' );
const ObjectType = require( '../../models/ObjectTypeModel' );
const { REQUIREDFIELDS, REQUIREFIELDS_PARENT } = require( '../constants' );
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
    const aggregationPipeline = [
        {
            $geoNear: {
                near: { type: 'Point', coordinates: [ longitude, latitude ] },
                distanceField: 'distance',
                maxDistance: radius,
                spherical: true
            }
        }
    ];

    return { aggregationPipeline };
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

// find wobjects by specified filters(withMap, map)
const getWobjWithFilters = async ( { objectType, filter, limit = 30, skip = 0 } ) => {
    const aggregationPipeline = [];

    if ( !validateInput( filter ) ) {
        return { error: { status: 422, message: 'Filter is not valid!' } };
    }
    if ( filter && filter.map ) {
        const { aggregationPipeline: mapCond, error: mapError } = await getMapCondition( {
            latitude: filter.map.coordinates[ 0 ],
            longitude: filter.map.coordinates[ 1 ],
            radius: filter.map.radius
        } );

        if ( mapError ) {
            return { error: mapError };
        }
        aggregationPipeline.push( ...mapCond );
    }
    aggregationPipeline.push( {
        $match: {
            object_type: objectType
        }
    } );
    if ( filter && filter.withMap ) {
        aggregationPipeline.push( {
            $match: { map: { $exists: true } }
        } );
    }
    // ///////////////////////////// ///
    // place here additional filters ///
    // ///////////////////////////// ///
    aggregationPipeline.push(
        {
            $sort: {
                weight: -1
            }
        }, {
            $skip: skip
        }, {
            $limit: limit
        }, {
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
        }, {
            $lookup: {
                from: 'wobjects',
                localField: 'parent',
                foreignField: 'author_permlink',
                as: 'parent'
            }
        } );
    const { wobjects, error: aggrError } = await Wobj.fromAggregation( aggregationPipeline );

    if( aggrError ) {
        if( aggrError.status === 404 ) {
            return { wobjects: [] };
        }
        return { error: aggrError };
    }
    return { wobjects };
};

const getObjectType = async ( { name = '', filter, wobjLimit, wobjSkip } ) => {
    const { objectType, error: objTypeError } = await ObjectType.getOne( { name: name } );

    if( objTypeError ) {
        return { error: objTypeError };
    }
    const { wobjects, error: wobjError } = await getWobjWithFilters( { objectType: name, filter, limit: wobjLimit + 1, skip: wobjSkip } );

    if( wobjError ) {
        return { error: wobjError };
    }
    objectType.related_wobjects = wobjects;
    if( objectType.related_wobjects.length === wobjLimit + 1 ) {
        objectType.hasMoreWobjects = true;
        objectType.related_wobjects = objectType.related_wobjects.slice( 0, wobjLimit );
    }
    objectType.related_wobjects.forEach( ( wobject ) => {
        // format wobjects parent field
        if( Array.isArray( wobject.parent ) ) {
            if( _.isEmpty( wobject.parent ) ) {
                wobject.parent = '';
            } else {
                wobject.parent = wobject.parent[ 0 ];
                wobject.parent.fields = wobject.parent.fields.filter( ( item ) => REQUIREFIELDS_PARENT.includes( item.name ) );
            }
        }
    } );

    objectType.filters = await getFilters( name );
    // const { post } = await postsUtil.getPost( objectType.author, objectType.permlink );
    // if( post && post.body ) { objectType.body = post.body }
    return { objectType };

};

const getFilters = async( object_type ) => {
    const resFilters = {};
    const { wobjects: wobjectsWithMap } = await Wobj.fromAggregation( [
        {
            $match: {
                $and: [
                    { object_type },
                    { map: { $exists: true } }
                ]
            }
        }, {
            $project: {
                _id: 1
            }
        } ] );

    if( !_.isEmpty( wobjectsWithMap ) ) {
        resFilters.map = [ 'map' ];
    }
    return resFilters;
};

module.exports = { getObjectType };
