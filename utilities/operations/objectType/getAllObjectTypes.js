const { ObjectType } = require( '../../../models' );
const _ = require( 'lodash' );

const makePipeline = ( { limit, skip } ) => {
    const pipeline = [
        { $skip: skip },
        {
            $lookup: {
                from: 'wobjects',
                localField: 'top_wobjects',
                foreignField: 'author_permlink',
                as: 'related_wobjects'
            }
        }
    ];

    if( limit ) pipeline.splice( 1, 0, { $limit: limit } );
    return pipeline;
};

module.exports = async ( { limit, skip, wobjects_count = 3 } ) => {
    const { result: objectTypes, error } = await ObjectType.aggregate(
        makePipeline( { limit, skip } )
    );

    if( error ) return { error };
    for( let type of objectTypes ) {
        type.related_wobjects = _.orderBy( type.related_wobjects, [ 'weight' ], [ 'desc' ] );
        if( type.related_wobjects.length > wobjects_count ) {
            type.hasMoreWobjects = true;
            type.related_wobjects = type.related_wobjects.slice( 0, wobjects_count );
        }
    }

    return { objectTypes };
};
