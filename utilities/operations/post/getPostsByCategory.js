const ObjectId = require( 'mongoose' ).Types.ObjectId;
const { Post } = require( '../../../database' ).models;
const { Post: PostService } = require( '../../../models' );
const { postHelper } = require( '../../helpers' );
const { DAYS_FOR_HOT_FEED, DAYS_FOR_TRENDING_FEED, MEDIAN_USER_WAIVIO_RATE } = require( '../../constants' );
const _ = require( 'lodash' );

const objectIdFromDaysBefore = ( daysCount ) => {
    let startDate = new Date();
    startDate.setDate( startDate.getDate() - daysCount );
    startDate.setMilliseconds( 0 );
    startDate.setSeconds( 0 );
    startDate.setMinutes( 0 );
    startDate.setHours( 0 );
    let str = Math.floor( startDate.getTime() / 1000 ).toString( 16 ) + '0000000000000000';
    return new ObjectId( str );
};

const makeConditions = ( { category, user_languages } ) => {
    let cond = {};
    let sort = {};
    switch ( category ) {
        case 'created':
            sort = { _id: -1 };
            break;
        case 'hot':
            cond = { _id: { $gte: objectIdFromDaysBefore( DAYS_FOR_HOT_FEED ) } };
            sort = { children: -1 };
            break;
        case 'trending':
            cond = {
                author_weight: { $gte: MEDIAN_USER_WAIVIO_RATE },
                _id: { $gte: objectIdFromDaysBefore( DAYS_FOR_TRENDING_FEED ) }
            };
            sort = { net_rshares: -1 };
    }
    if( !_.isEmpty( user_languages ) ) cond.language = { $in: user_languages };
    return { cond, sort };
};

module.exports = async ( { category, skip, limit, user_languages } ) => {
    const { cond, sort } = makeConditions( { category, user_languages } );
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
