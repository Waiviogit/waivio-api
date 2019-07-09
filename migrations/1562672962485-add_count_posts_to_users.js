'use strict';
const User = require( '../database' ).models.User;
const Post = require( '../database' ).models.Post;

/**
 * Make any changes you need to make to the database here
 */
exports.up = async function up ( done ) {
    const users = await User.find().batchSize( 1000 );

    for( const user of users ) {
        const posts = await Post.find( { author: user.name } );

        await User.updateOne( {
            name: user.name
        }, {
            $set: {
                count_posts: posts.length
            }
        },
        {
            new: true,
            strict: false
        } );
    }
    done();
};

/**
 * Make any changes that UNDO the up function side effects here (if possible)
 */
exports.down = function down( done ) {
    done();
};
