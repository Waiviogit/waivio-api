const { postsUtil } = require( '../../steemApi' );
const { mergeSteemCommentsWithDB } = require( '../../helpers/commentHelper' );
const _ = require( 'lodash' );

module.exports = async ( { author, permlink, category } ) => {
    const { result: postState, error } = await postsUtil.getPostState( { author, permlink, category } );
    if( error ) return { error };
    const comments = await mergeComments( postState );
    postState.content = _.keyBy( comments, ( c ) => `${c.author}/${c.permlink}` );
    return { result: postState };
};

const mergeComments = async( postState ) => {
    const steemComments = _.chain( postState ).get( 'content', [] ).values().value();
    return await mergeSteemCommentsWithDB( { steemComments } );
};
