const { Comment, User } = require( '../../../models' );
const { postsUtil } = require( '../../steemApi' );
const { mergeSteemCommentsWithDB, mergeDbCommentsWithSteem } = require( '../../helpers/commentHelper' );
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
    if( error || steemComments.error ) return{ error: error || steemComments.error };

    const mergedComments = await mergeSteemCommentsWithDB( {
        steemComments: steemComments.slice( start_permlink ? 1 : 0 )
    } );
    return{ comments: mergedComments };

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

