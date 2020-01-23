const { Wobj } = require( '../../../models' );
const wObjectHelper = require( '../../helpers/wObjectHelper' );
const UserWobjectsModel = require( '../../../database' ).models.UserWobjects;
const { REQUIREDFIELDS, REQUIREFIELDS_PARENT } = require( '../../constants' );
const _ = require( 'lodash' );

const getMany = async ( data ) => {
    data.required_fields = _.uniq( [ ...data.required_fields, ...REQUIREDFIELDS ] );
    const { wObjectsData: wObjects, hasMore, error } = await Wobj.getAll( data );

    if( error ) {
        return { error };
    }
    if( data.user_limit ) {
        await Promise.all( wObjects.map( async ( wobject ) => {
            wobject.users = await UserWobjectsModel.aggregate( [
                { $match: { author_permlink: wobject.author_permlink } },
                { $sort: { weight: -1 } },
                { $limit: data.user_limit },
                {
                    $project: {
                        _id: 0,
                        name: '$user_name',
                        weight: 1
                    }
                }
            ] );
        } ) );
    } // assign top users to each of wobject

    wObjects.forEach( ( wObject ) => {
        wObject.users = wObject.users || [];
        wObject.user_count = wObject.users.length; // add field user count
        // wObjectHelper.formatRequireFields( wObject, data.locale, data.required_fields.map( ( item ) => ( { name: item } ) ) );
        // format parent field
        if( Array.isArray( wObject.parent ) ) {
            if( _.isEmpty( wObject.parent ) ) {
                wObject.parent = '';
            } else {
                wObject.parent = wObject.parent[ 0 ];
                getRequiredFields( wObject.parent, REQUIREFIELDS_PARENT );
            }
        }
    } );

    return { wObjectsData: wObjects, hasMore };
};

const getRequiredFields = function ( wObject, requiredFields ) {
    wObject.fields = wObject.fields.filter( ( item ) => requiredFields.includes( item.name ) );
};

module.exports = { getMany };
