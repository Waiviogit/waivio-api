const { Post: PostService } = require( '../../../models' );
const { Post } = require( '../../../database' ).models;
const { postHelper } = require( '../../helpers' );
const _ = require( 'lodash' );

const makeCondition = ( { name, author_permlinks } ) => {
    const cond = { author: name };
    if( _.isArray( author_permlinks ) && !_.isEmpty( author_permlinks ) && author_permlinks.each( _.isString ) ) {
        cond[ 'wobjects.author_permlink' ] = { $in: { ...author_permlinks } };
    }
    return cond;
};

// TO DO: add move to our api, add resteems, filters by wobjects
module.exports = async ( { name, limit = 10, skip = 0, author_permlinks } ) => {
    let posts;
    const cond = makeCondition( { name, author_permlinks } );
    try {
        posts = await Post
            .find( cond )
            .sort( { _id: -1 } )
            .skip( skip )
            .limit( limit )
            .populate( { path: 'fullObjects', select: '-latest_posts' } )
            .lean();
    } catch ( error ) {
        return { error };
    }
    posts = await PostService.fillObjects( posts ); // format wobjects on each post
    await postHelper.addAuthorWobjectsWeight( posts ); // add to each post author his weight in wobjects
    return { posts };
};
