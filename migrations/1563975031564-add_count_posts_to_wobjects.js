'use strict';
const Wobj = require( '../database' ).models.WObject;
const Post = require( '../database' ).models.Post;

/**
 * Make any changes you need to make to the database here
 */
exports.up = async function up ( done ) {
    try {
        const wobjects = await Wobj.aggregate( [ { $project: { _id: 0, author_permlink: 1 } } ] );

        for( const author_permlink of wobjects.map( ( w ) => w.author_permlink ) ) {
            const count_posts = await Post.countDocuments( { 'wobjects.author_permlink': author_permlink } );

            await Wobj.updateOne( { author_permlink }, { $set: { count_posts: count_posts } } );

            console.log( `${author_permlink} wobject with ${count_posts} posts updated!` );
        }
    } catch ( error ) {
        console.error( error );
        return;
    }
    done();
};
/**
 * Make any changes that UNDO the up function side effects here (if possible)
 */
exports.down = async function down( done ) {
    await Wobj.update( {}, { $unset: { count_posts: '' } } );
    done();
};

