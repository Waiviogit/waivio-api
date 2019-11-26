const { Wobj } = require( '../../../models' );
const _ = require( 'lodash' );

module.exports = async ( { author_permlink, fields_names, custom_fields } ) => {
    let pipeline = [
        { $match: { author_permlink } },
        { $unwind: '$fields' },
        { $replaceRoot: { newRoot: '$fields' } }
    ];
    if( !_.isEmpty( fields_names ) ) {
        pipeline.push( { $match: { name: { $in: [ ...fields_names ] } } } );
    }
    if( !_.isEmpty( custom_fields ) ) {
        let cond = {};
        for( const key in custom_fields ) {
            cond[ key ] = custom_fields[ key ];
        }
        pipeline.push( { $match: cond } );
    }
    const { wobjects: fields, error } = await Wobj.fromAggregation( pipeline );
    return{ fields, error };

};
