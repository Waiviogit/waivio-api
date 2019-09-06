const { ObjectType, Wobj } = require( '../../../models' );

const objectTypePipeline = ( { limit, skip, wobjects_count } ) => {
    const pipeline = [
        { $skip: skip },
        { $addFields: { top_wobjects: { $slice: [ '$top_wobjects', wobjects_count ] } } }
    ];

    if( limit ) pipeline.splice( 1, 0, { $limit: limit } );
    return pipeline;
};

const relatedWobjectsPipeline = ( author_permlinks ) => {
    return [
        { $match: { author_permlink: { $in: author_permlinks } } },
        { $sort: { weight: -1, _id: -1 } }
    ];
};

module.exports = async ( { limit, skip, wobjects_count = 3 } ) => {
    const { result: objectTypes, error } = await ObjectType.aggregate( objectTypePipeline( { limit, skip, wobjects_count: wobjects_count + 1 } ) );
    if( error ) return { error };

    for( let type of objectTypes ) {
        const { wobjects = [], error: wobjError } = await Wobj.fromAggregation( relatedWobjectsPipeline( type.top_wobjects ) );
        if( wobjError ) return { error: wobjError };

        type.related_wobjects = wobjects;
        if( type.related_wobjects.length > wobjects_count ) {
            type.hasMoreWobjects = true;
            type.related_wobjects = type.related_wobjects.slice( 0, wobjects_count );
        }
    }

    return { objectTypes };
};
