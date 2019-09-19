const { Wobj } = require( '../../../models' );
const { REQUIREFIELDS_CHILD } = require( '../../constants' );
const _ = require( 'lodash' );

module.exports = async ( { skip, limit, author_permlink } ) => {
    const { wobjects, error } = await Wobj.getChildWobjects( { skip, limit, author_permlink } );
    if( error ) return { error };
    wobjects.forEach( ( wobject ) => {
        wobject.fields = _.filter( wobject.fields, ( f ) => REQUIREFIELDS_CHILD.includes( f.name ) );
    } );
    return { wobjects };
};
