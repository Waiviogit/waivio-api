const _ = require( 'lodash' );
const { User, Wobj } = require( '../../models' );
const { Post: PostModel } = require( '../../database' ).models;


const getUsersList = async ( userName ) => {
    const { error, user } = await User.getOne( userName );
    if ( error ) return { error };
    if( !user ) return { error: { status: 404, message: 'User not found' } };
    if ( !user.objects_follow.length ) return { error: { status: 422, message: 'User not subscribed to any objects' } };
    return await parsePostsForAuthors( user.objects_follow );
};

const parsePostsForAuthors = async ( wobjList ) => {
    let users = [];
    let conditions = [];
    let { wobjects, error } = await Wobj.fromAggregation( [ { $match: { author_permlink: { $in: wobjList } } } ] );

    if( error ) return { error };

    for ( let wobj of wobjects ) {
        if ( !wobj.newsFilter ) {
            let posts = await PostModel.find( { _id: { $in: [ ...wobj.latest_posts || [] ] }, 'wobjects.author_permlink': wobj.author_permlink } );
            _.forEach( posts, ( post ) => users.push( post.author ) );
            continue;
        }
        const newsFilter = wobj.newsFilter;
        let firstCond = {}, secondCond = {};
        if( Array.isArray( newsFilter.allowList ) && !_.isEmpty( newsFilter.allowList ) && _.some( newsFilter.allowList, ( rule ) => Array.isArray( rule ) && rule.length ) ) {
            let cond = [ { 'wobjects.author_permlink': wobj.author_permlink } ];
            newsFilter.allowList.forEach( ( allowRule ) => {
                if( Array.isArray( allowRule ) && allowRule.length ) {
                    cond.push(
                        {
                            'wobjects.author_permlink': {
                                $all: allowRule
                            }
                        } );
                }
            } );
            firstCond = { $or: cond };
        }else {
            firstCond = { 'wobjects.author_permlink': wobj.author_permlink };
        }
        secondCond = {
            'wobjects.author_permlink': {
                $nin: Array.isArray( newsFilter.ignoreList ) ? newsFilter.ignoreList : []
            }
        };
        conditions.push( { $and: [ firstCond, secondCond ] } ) ;
    }
    const pipeline = { $or: conditions };
    users = _.union( _.uniq( users ), await getPostsAuthors( pipeline ) );
    return { users: users };
};


const getPostsAuthors = async ( data ) => {
    let posts = [], authors = [];
    try {
        posts = await PostModel.find( data )
            .lean();
    } catch ( error ) {
        return { error };
    }
    _.forEach( posts, ( post ) => {
        authors.push( post.author );
    } );
    return authors;
};

module.exports = { getUsersList };
