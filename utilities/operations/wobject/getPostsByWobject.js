const { Wobj, Post } = require( '../../../models' );
const { WOBJECT_LATEST_POSTS_COUNT } = require( '../../constants' );
const { postHelper } = require( '../../helpers' );

const makePipeline = async ( data ) => {
    let { condition, error: conditionError } = await getWobjFeedCondition( data );

    if ( conditionError ) return { error: conditionError };
    return [
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
};
// Make condition for database aggregation using newsFilter if it exist, else only by "wobject"
const getWobjFeedCondition = async ( { author_permlink, skip, limit } ) => {
    let { wobjects: [ wObject ], error } = await Wobj.fromAggregation( [ { $match: { author_permlink: author_permlink } } ] );

    if( error ) return { error };

    if ( !wObject.newsFilter ) {
        if( !skip && limit <= WOBJECT_LATEST_POSTS_COUNT ) {
            return { condition: { $match: { _id: { $in: [ ...wObject.latest_posts || [] ] } } } };
        }
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

module.exports = async ( data ) => {
    const pipeline = await makePipeline( data );
    let { posts, error } = await Post.aggregate( pipeline );

    if( error ) return { error };
    await postHelper.addAuthorWobjectsWeight( posts );
    posts = await Post.fillObjects( posts );
    return { posts };
};
