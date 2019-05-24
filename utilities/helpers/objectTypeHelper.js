const { Wobj } = require( '../../models' );

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
