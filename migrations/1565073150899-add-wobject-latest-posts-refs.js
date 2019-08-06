'use strict';
const { WObject, Post } = require( '../database' ).models;
const { WOBJECT_LATEST_POSTS_COUNT } = require( '../utilities/constants' );
/**
 * Make any changes you need to make to the database here
 */

exports.up = async function up ( done ) {
    let cursor = WObject.find().cursor( { batchSize: 1000 } );

    await cursor.eachAsync( async ( doc ) => {
        const posts_array = await Post.aggregate( [
            { $match: { 'wobjects.author_permlink': doc.author_permlink } },
            { $sort: { _id: -1 } },
            { $limit: WOBJECT_LATEST_POSTS_COUNT },
            { $project: { _id: 1 } }
        ] );
        const ids_array = posts_array.map( ( p ) => p._id );
        const res = await WObject.updateOne( { _id: doc._id }, { $set: { latest_posts: ids_array } } );

        if( res.nModified ) {
            console.log( `Wobject ${doc.author_permlink} updated! Add ${ids_array.length} pots refs!` );
        }
    } );

    done();
};

/**
 * Make any changes that UNDO the up function side effects here (if possible)
 */
exports.down = function down( done ) {
    done();
};
