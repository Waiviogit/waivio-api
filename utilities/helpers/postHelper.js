const Wobj = require( '../../models/wObjectModel' );
const User = require( '../../models/UserModel' );
const PostModel = require( '../../models/PostModel' );
const CommentRef = require( '../../models/CommentRef' );
const { Post } = require( '../../database' ).models;
const { postsUtil } = require( '../steemApi' );
const _ = require( 'lodash' );

/**
 * Get wobjects data for particular post
 * @param author {String}
 * @param permlink {String}
 * @returns {Promise<{wObjectsData: *, wobjectPercents: *}>}
 * wObjectsData - full wobjects info(fields, def.name, posts counts etc.),
 * wobjectPercent - author_permlinks with percent which author noticed on particular post
 */
const getPostObjects = async function( author = '', permlink = '' ) {
    const { commentRef } = await CommentRef.getRef( `${author}_${permlink}` );

    if( _.isString( _.get( commentRef, 'wobjects' ) ) ) {
        let wobjs; // list of wobjects on post with percents

        try {
            wobjs = JSON.parse( commentRef.wobjects );
        } catch ( e ) {
            console.log( e );
        }
        if( Array.isArray( wobjs ) && !_.isEmpty( wobjs ) ) {
            const { wObjectsData } = await Wobj.getAll( {
                author_permlinks: wobjs.map( ( w ) => w.author_permlink ),
                skip: 0,
                limit: 100,
                user_limit: 0,
                locale: 'en-US'
            } );

            return { wObjectsData, wobjectPercents: wobjs };
        }
    }
};

const getPostsByCategory = async function( data ) {
    let { posts, error } = await postsUtil.getPostsByCategory( data );

    if( error ) {
        return { error };
    }
    if( !posts || posts.error ) {
        return { error: { status: 404, message: posts.error.message } };
    }
    for ( let post of posts ) {
        if( post && post.author && post.permlink ) {
            const wobjsResult = await getPostObjects( post.author, post.permlink );
            post.wobjects = _.get( wobjsResult, 'wobjectPercents', [] );
            post.fullObjects = _.get( wobjsResult, 'wObjectsData', [] );
            post = await mergePostData( post );
        }
    }
    return { posts };
};

/**
 * Get post from DB and merge fields which doesn't exists in source post(from steem)
 * @param postSteem
 * @param postDb *optional*
 * @returns {Promise<{error: *}|*>}
 */
const mergePostData = async ( postSteem, postDb ) => {
    if( !postDb ) {
        const { post: dbPost, error } = await PostModel.getOne( {
            root_author: postSteem.root_author || postSteem.author,
            permlink: postSteem.permlink
        } );
        if( error || !dbPost ) return postSteem;
        postDb = dbPost;
    }
    const diffKeys = _.difference( Object.keys( postDb || {} ), Object.keys( postSteem ) );
    diffKeys.forEach( ( key ) => {
        postSteem[ key ] = postDb[ key ];
    } );
    // fill active_votes in case votes from guest users
    postDb.active_votes.forEach( ( dbVote ) => {
        if( !postSteem.active_votes.find( ( v ) => v.voter === dbVote.voter ) ) {
            postSteem.active_votes.push( dbVote );
        }
    } );

    return postSteem;
};

// Make condition for database aggregation using newsFilter if it exist, else only by "wobject"
const getWobjFeedCondition = async ( author_permlink ) => {
    const { wObject, error } = await Wobj.getOne( author_permlink );

    if( error ) {
        return { error };
    } else if ( !wObject.newsFilter ) {
        return { condition: { $match: { 'wobjects.author_permlink': author_permlink } } };
    }
    const newsFilter = wObject.newsFilter;

    if( !newsFilter.allowList && !newsFilter.ignoreList ) {
        return { error: { message: 'Format not exist all require fields' } };
    }
    let firstCond, secondCond;

    if( Array.isArray( newsFilter.allowList ) && !_.isEmpty( newsFilter.allowList ) && _.some( newsFilter.allowList, ( rule ) => Array.isArray( rule ) && rule.length ) ) {
        const orCondArr = [ { 'wobjects.author_permlink': author_permlink } ];

        newsFilter.allowList.forEach( ( allowRule ) => {
            if( Array.isArray( allowRule ) && allowRule.length ) {
                orCondArr.push(
                    {
                        'wobjects.author_permlink': {
                            $all: allowRule
                        }
                    } );
            }
        } );
        firstCond = { $or: orCondArr };
    } else {
        firstCond = { 'wobjects.author_permlink': author_permlink };
    }
    secondCond = {
        'wobjects.author_permlink': {
            $nin: Array.isArray( newsFilter.ignoreList ) ? newsFilter.ignoreList : []
        }
    };

    return { condition: { $match: { $and: [ firstCond, secondCond ] } } };
};

const addAuthorWobjectsWeight = async ( posts = [] ) => {
    const names = posts.map( ( p ) => p.author );
    const { result: users, error } = await User.aggregate( [ { $match: { name: { $in: names } } }, { $project: { name: 1, wobjects_weight: 1 } } ] );

    if( error || !users ) {
        console.error( error || 'Get Users wobjects_weight no result!' );
        return;
    }
    posts.forEach( ( post ) => {
        post.author_wobjects_weight = _.get( users.find( ( user ) => user.name === post.author ), 'wobjects_weight' );
    } );
};

const fillReblogs = async ( posts = [] ) => {
    for( const post_idx in posts ) {
        if( _.get( posts, `[${post_idx}].reblog_to.author` ) && _.get( posts, `[${post_idx}].reblog_to.permlink` ) ) {
            let sourcePost;
            try {
                sourcePost = await Post
                    .findOne( {
                        author: _.get( posts, `[${post_idx}].reblog_to.author` ),
                        permlink: _.get( posts, `[${post_idx}].reblog_to.permlink` )
                    } )
                    .populate( { path: 'fullObjects', select: '-latest_posts -last_posts_counts_by_hours' } )
                    .lean();
            } catch ( error ) {
                console.error( error );
            }
            if( sourcePost ) posts[ post_idx ] = { ...sourcePost, reblogged_by: posts[ post_idx ].author };
        }
    }
};

module.exports = { getPostObjects, getPostsByCategory, getWobjFeedCondition, addAuthorWobjectsWeight, fillReblogs, mergePostData };
