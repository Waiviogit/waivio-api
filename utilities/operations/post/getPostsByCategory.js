const ObjectId = require( 'mongoose' ).Types.ObjectId;
const { Post } = require( '../../../database' ).models;
const { Post: PostService } = require( '../../../models' );
const { postHelper } = require( '../../helpers' );
const { DAYS_FOR_HOT_FEED, DAYS_FOR_TRENDING_FEED } = require( '../../constants' );
const _ = require( 'lodash' );

const objectIdFromDaysBefore = ( daysCount ) => {
    let startDate = new Date();
    startDate.setDate( startDate.getDate() - daysCount );
    startDate.setMilliseconds( 0 );
    startDate.setSeconds( 0 );
    startDate.setMinutes( 0 );
    startDate.setHours( 0 );
    return new ObjectId( Math.floor( startDate.getTime() / 1000 ).toString( 16 ) + '0000000000000000' );
};

const makeConditions = ( { category, tag, user_languages } ) => {
    let cond = {};
    let sort = {};
    switch ( category ) {
        case 'blog':
            cond = { author: tag };
            sort = { _id: -1 };
            break;
        case 'created':
            sort = { _id: -1 };
            break;
        case 'hot':
            cond = { _id: { $gte: objectIdFromDaysBefore( DAYS_FOR_HOT_FEED ) } };
            sort = { children: -1 };
            break;
        // case 'trending':
        //     cond = { _id: { $gte: objectIdFromDaysBefore( DAYS_FOR_TRENDING_FEED ) } }; // to do (: add filter by 50 % top users(by waivio rating)
        //     sort = {net_rshares:1};
    }
    if( !_.isEmpty( user_languages ) ) cond.language = { $in: user_languages };
    return{ cond, sort };
};

module.exports = async ( { category, tag, skip, limit, user_languages } ) => {

    // #stub for trending feed
    if( category === 'trending' ) return { posts: [] };
    // #stub for trending feed

    const { cond, sort } = makeConditions( { category, tag, user_languages } );
    let posts = [];
    try {
        posts = await Post
            .find( cond )
            .sort( sort )
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
