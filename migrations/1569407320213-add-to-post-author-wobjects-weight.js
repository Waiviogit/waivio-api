'use strict';

const { Post } = require( '../database' ).models;
const { User: UserService } = require( '../models' );
const _ = require( 'lodash' );

const update = async () => {
    let cursor = Post.find().cursor( { batchSize: 1000 } );
    let success_count = 0;
    await cursor.eachAsync( async ( doc ) => {
        let post = doc.toObject();
        const { user, error } = await UserService.getOne( post.author );
        if( error ) console.error( error );
        if( _.get( user, 'wobjects_weight' ) ) {
            const res = await Post.updateOne( { _id: post._id }, { $set: { author_weight: user.wobjects_weight } } );

            if( res.nModified ) success_count++;
        }
        if( success_count % 1000 === 0 ) console.log( success_count );
    } );
    return success_count;
};

/**
 * Make any changes you need to make to the database here
 */
exports.up = async function up ( done ) {
    const success_count = await update();
    console.log( `Updating post finished! ${success_count} posts successfully updated!` );
    done();
};

/**
 * Make any changes that UNDO the up function side effects here (if possible)
 */
exports.down = async function down( done ) {
    await Post.update( {}, { $unset: { author_weight: '' } } );
    done();
};
