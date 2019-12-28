'use strict';
const { User } = require( '../database' ).models;

/**
 * Make any changes you need to make to the database here
 */
/**
 * Make any changes you need to make to the database here
 */
exports.up = async function up ( done ) {
    let cursor = User.find().cursor( { batchSize: 1000 } );
    await cursor.eachAsync( async ( doc ) => {
        const user = await User.findOne( { name: doc.name } ).populate( 'followers_count_virtual' ).lean();
        if( user && user.followers_count_virtual ) {
            const res = await User.updateOne( { name: doc.name }, { $set: { followers_count: user.followers_count_virtual } } );
            if ( res.nModified ) {
                console.log( `User ${doc.name} "followers_count" updated!` );
            }
        }
    } );
    done();
};


/**
 * Make any changes that UNDO the up function side effects here (if possible)
 */
exports.down = async function down( done ) {
    await User.update( {}, { $unset: { followers_count: '' } } );
    console.log( 'Deleted field "user_metadata" from all of users!' );
    done();
};
