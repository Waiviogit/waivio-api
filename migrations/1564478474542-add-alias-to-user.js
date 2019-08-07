'use strict';
const User = require( '../database' ).models.User;
const _ = require( 'lodash' );

/**
 * Make any changes you need to make to the database here
 */
exports.up = async function up ( done ) {
    let cursor = User.find().cursor( { batchSize: 1000 } );

    await cursor.eachAsync( async ( doc ) => {
        let parsed_metadata;

        try {
            parsed_metadata = JSON.parse( _.get( doc, 'json_metadata', {} ) );
        } catch ( error ) {
            console.error( `Error parse metadata for user ${doc.name}` );
            return;
        }
        const alias = _.get( parsed_metadata, 'profile.name', undefined );

        if( !alias || typeof alias !== 'string' || !alias.length ) {
            return;
        }
        const res = await User.updateOne( { name: doc.name }, { $set: { alias } } );

        if( res.nModified ) {
            console.log( `User ${doc.name} alias updated!` );
        }
    } );
    done();
};

/**
 * Make any changes that UNDO the up function side effects here (if possible)
 */
exports.down = async function down( done ) {
    await User.update( {}, { $unset: { alias: '' } } );
    done();
};
