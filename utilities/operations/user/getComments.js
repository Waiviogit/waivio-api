const { Comment, User } = require( '../../../models' );
const { postsUtil } = require( '../../steemApi' );
const _ = require( 'lodash' );

module.exports = async ( { name, start_permlink, limit, skip } ) => {
    if( await isGuestUser( name ) ) {
        return await getGuestComments( { name, skip, limit } );
    }
    return await getSteemUserComments( { start_author: name, start_permlink, limit } );

};

const getGuestComments = async ( { name, skip, limit } ) => {
    const { comments: dbComments, error: dbError } = await Comment.getMany( { cond: { 'guestInfo.userId': name }, skip, limit } );
    if( dbError ) return { error: dbError };
    const mergedComments = await mergeDbCommentsWithSteem( { dbComments } );
    return { comments: mergedComments };
};

const getSteemUserComments = async ( { start_author, start_permlink, limit } ) => {
    const cond = start_permlink ? { start_author, start_permlink, limit: limit + 1 } : { start_author, limit };
    const { comments: steemComments, error } = await postsUtil.getUserComments( cond );
    if( error ) return{ error };

    const mergedComments = await mergeSteemCommentsWithDB( {
        steemComments: steemComments.slice( start_permlink ? 1 : 0 )
    } );
    return{ comments: mergedComments };

};

// return steemComments
const mergeSteemCommentsWithDB = async ( { steemComments, dbComments } ) => {
    if( !dbComments || _.isEmpty( dbComments ) ) {
        const cond = {
            $or: [
                ...steemComments.map( ( c ) => ( { ..._.pick( c, [ 'author', 'permlink' ] ) } ) )
            ]
        };
        const { result: dbComm } = await Comment.findByCond( cond );
        dbComments = dbComm;
    }
    const resComments = steemComments.map( ( stComment ) => {
        const dbComm = _.find( dbComments, { ..._.pick( stComment, [ 'author', 'permlink' ] ) } );
        if( dbComm ) {
            stComment.active_votes.push( ...dbComm.active_votes );
            stComment.guestInfo = dbComm.guestInfo;
        }
        return stComment;
    } );
    return resComments;
};

// return dbComments
const mergeDbCommentsWithSteem = async ( { dbComments, steemComments } ) => {
    if( !steemComments || _.isEmpty( steemComments ) ) {
        const { posts: stComments } = await postsUtil.getManyPosts(
            dbComments.map( ( c ) => ( { ..._.pick( c, [ 'author', 'permlink' ] ) } ) )
        );
        steemComments = stComments;
    }
    const resComments = dbComments.map( ( dbComment ) => {
        const steemComment = _.find( steemComments, { ..._.pick( dbComment, [ 'author', 'permlink' ] ) } );
        if( steemComment ) {
            steemComment.active_votes.push( ...dbComment.active_votes );
            steemComment.guestInfo = dbComment.guestInfo;
            return steemComment;
        }
        return dbComment;
    } );
    return resComments;
};

/**
 * Check for guest user
 * @param name {String} name of user
 * @returns {Promise<boolean>} Return true if user exist and it's guest user, else false
 */
const isGuestUser = async ( name ) => {
    const { user, error } = await User.getOne( name );
    return user && user.auth;
};

