'use strict';
const { WObject, ObjectType } = require( '../database' ).models;
const { OBJECT_TYPE_TOP_WOBJECTS_COUNT } = require( '../utilities/constants' );
/**
 * Make any changes you need to make to the database here
 */

exports.up = async function up ( done ) {
    let cursor = ObjectType.find().cursor( { batchSize: 1000 } );

    await cursor.eachAsync( async ( doc ) => {
        const wobjs_array = await WObject
            .find( { 'object_type': doc.name } )
            .sort( { weight: -1 } )
            .limit( OBJECT_TYPE_TOP_WOBJECTS_COUNT );
        const author_permlinks = wobjs_array.map( ( p ) => p.author_permlink );
        const res = await ObjectType.updateOne( { _id: doc._id }, { $set: { top_wobjects: author_permlinks } } );

        if( res.nModified ) {
            console.log( `Object Type ${doc.name} updated! Add ${author_permlinks.length} wobjects refs!` );
        }
    } );
    done();
};
/**
 * Make any changes that UNDO the up function side effects here (if possible)
 */
exports.down = async function down( done ) {
    await ObjectType.update( {}, { $unset: { top_wobjects: '' } } );
    console.log( 'Deleted field "top_wobjects" from all of ObjectTypes!' );
    done();
};
