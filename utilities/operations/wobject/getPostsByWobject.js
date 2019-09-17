const { Wobj, Post } = require( '../../../models' );
const { WOBJECT_LATEST_POSTS_COUNT } = require( '../../constants' );
const { postHelper, userLocalesHelper } = require( '../../helpers' );
const _ = require( 'lodash' );

const makePipeline = async ( data ) => {
    const { user_locales, error: userError } = await userLocalesHelper.getUserLocales( data.user_name );
    if( userError ) return { error: userError };
    let { condition, error: conditionError } = await getWobjFeedCondition( { ...data, user_locales } );

    if ( conditionError ) return { error: conditionError };
    const pipeline = [
        condition,
        { $sort: { _id: -1 } },
        { $skip: data.skip },
        { $limit: data.limit },
        {
            $lookup: {
                from: 'wobjects',
                localField: 'wobjects.author_permlink',
                foreignField: 'author_permlink',
                as: 'fullObjects'
            }
        }
    ];

    return { pipeline };
};
// Make condition for database aggregation using newsFilter if it exist, else only by "wobject"
const getWobjFeedCondition = async ( { author_permlink, skip, limit, user_locales } ) => {
    let condition = {};
    let { wobjects: [ wObject = {} ] = [], error } = await Wobj.fromAggregation( [ { $match: { author_permlink: author_permlink } } ] );

    if( error ) return { error };

    if ( !wObject.newsFilter ) {
        if( !skip && limit <= WOBJECT_LATEST_POSTS_COUNT && !user_locales ) {
            // if wobject have no newsFilter and count of posts less than cashed count => get posts from cashed array
            return { condition: { $match: { _id: { $in: [ ...wObject.latest_posts || [] ] } } } };
        }
        condition = { $match: { 'wobjects.author_permlink': author_permlink } };
        if( user_locales ) condition.$match.language = { $in: user_locales };
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
    condition = { $match: { $and: [ firstCond, secondCond ] } };
    if( user_locales ) condition.$match.$and.push( { language: { $in: user_locales } } );
    return { condition };
};

module.exports = async ( data ) => {
    // data: { author_permlink, limit, skip, user_name }
    const { pipeline, error: pipelineError } = await makePipeline( data );

    if( pipelineError ) return { error: pipelineError };
    let { posts, error } = await Post.aggregate( pipeline );

    if( error ) return { error };
    await postHelper.addAuthorWobjectsWeight( posts );
    posts = await Post.fillObjects( posts );
    return { posts };
};
