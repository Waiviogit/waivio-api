'use strict';
const { WObject } = require( '../database' ).models;
const _ = require( 'lodash' );

/**
 * Make any changes you need to make to the database here
 */
exports.up = async ( done ) => {
    let cursor = WObject.find( { 'fields.name': 'rating' } ).cursor( { batchSize: 1000 } );

    await cursor.eachAsync( async ( doc ) => {
        const wobject = doc.toObject();
        const ratingFields = wobject.fields.filter( ( f ) => f.name === 'rating' );

        for( let field of ratingFields ) {
            if( !_.isEmpty( field.rating_votes ) ) {
                const res = await WObject.update(
                    { _id: doc._id, 'fields.author': field.author, 'fields.permlink': field.permlink },
                    { $set: { [ 'fields.$.average_rating_weight' ]: _.meanBy( field.rating_votes, 'rate' ) } }
                );
                if( res.nModified ) {
                    console.log( `Field  rating on wobject ${doc.author_permlink} updated! Now rating ${field.body} has average weight ${_.meanBy( field.rating_votes, 'rate' )}!` );
                }
            }
        }

    } );
    done();
};

/**
 * Make any changes that UNDO the up function side effects here (if possible)
 */
exports.down = async ( done ) => {
    let cursor = WObject.find( { 'fields.name': 'rating' } ).cursor( { batchSize: 1000 } );

    await cursor.eachAsync( async ( doc ) => {
        const wobject = doc.toObject();
        const ratingFields = wobject.fields.filter( ( f ) => f.name === 'rating' );

        for( let field of ratingFields ) {
            if( field.average_rating_weight ) {
                const res = await WObject.update(
                    { _id: doc._id, 'fields.author': field.author, 'fields.permlink': field.permlink },
                    { $unset: { [ 'fields.$.average_rating_weight' ]: '' } }
                );
                if( res.nModified ) {
                    console.log( `Field  rating on wobject ${doc.author_permlink} updated! Key "average rating weight" deleted!` );
                }
            }
        }
    } );
    done();
};
