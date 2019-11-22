const { Wobj } = require( '../../../models' );
const { Post: PostModel } = require( '../../../database' ).models;
const { WOBJECT_LATEST_POSTS_COUNT } = require( '../../constants' );
const _ = require( 'lodash' );

const getPosts = async ( data ) => {
    let { condition, error: conditionError } = await getWobjFeedCondition( { ...data } );

    if ( conditionError ) return { error: conditionError };
    let posts = [];
    try {
        posts = await PostModel.find( condition )
            .sort( { _id: -1 } )
            .skip( data.skip )
            .limit( data.limit )
            .populate( { path: 'fullObjects', select: '-latest_posts -last_posts_counts_by_hours' } )
            .lean();
    } catch ( error ) {
        return { error };
    }

    return { posts };
};
// Make condition for database aggregation using newsFilter if it exist, else only by "wobject"
const getWobjFeedCondition = async ( { author_permlink, skip, limit, user_languages } ) => {
    let condition = {};
    let { wobjects: [ wObject = {} ] = [], error } = await Wobj.fromAggregation( [ { $match: { author_permlink: author_permlink } } ] );

    if( error ) return { error };

    if ( !wObject.newsFilter ) {
        if( !skip && limit <= WOBJECT_LATEST_POSTS_COUNT && _.isEmpty( user_languages ) ) {
            // if wobject have no newsFilter and count of posts less than cashed count => get posts from cashed array
            return { condition: { _id: { $in: [ ...wObject.latest_posts || [] ] } } };
        }
        condition = { 'wobjects.author_permlink': author_permlink };
        if( !_.isEmpty( user_languages ) ) condition.language = { $in: user_languages };
        condition.reblog_to = null;
        return { condition };
    }

    const newsFilter = wObject.newsFilter;

    if( !newsFilter.allowList && !newsFilter.ignoreList ) {
        return { error: { message: 'Format not include all required fields' } };
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
    condition = { $and: [ firstCond, secondCond ] };
    if( !_.isEmpty( user_languages ) ) condition.$and.push( { language: { $in: user_languages } } );
    condition.reblog_to = null;
    return { condition };
};

module.exports = async ( data ) => {
    // data: { author_permlink, limit, skip, user_name }
    let { posts, error: getPostsError } = await getPosts( data );
    if( getPostsError ) return { error: getPostsError };
    return { posts };
};
