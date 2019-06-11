const { Wobj } = require( '../../../models' );
const { getWobjExperts } = require( './objectExperts' );
const _ = require( 'lodash' );
const rankHelper = require( '../../helpers/rankHelper' );
const wObjectHelper = require( '../../helpers/wObjectHelper' );
const { REQUIREDFIELDS, REQUIREFIELDS_PARENT } = require( '../../constants' );

const getExperts = async ( { author_permlink, weight, username } ) => {
    if( username ) {
        let { experts: [ user = undefined ] = [], error: userError } = await getWobjExperts( { author_permlink, limit: 1, username } );

        if( userError ) {
            return { error: userError };
        }
        return { user };
    }

    let { experts: users = [], error } = await getWobjExperts( { author_permlink, limit: 5 } );

    if( error ) {
        return { error };
    }
    rankHelper.calculateForUsers( users, weight ); // add rank in wobject for each user
    users = _.orderBy( users, [ 'weight' ], [ 'desc' ] ); // order users by rank
    return { users };
};

const getOne = async ( data ) => { // get one wobject by author_permlink
    const { wObject, error: getWobjError } = await Wobj.getOne( data.author_permlink );

    if( getWobjError ) {
        return { error: getWobjError };
    }

    // format parent field
    if( Array.isArray( wObject.parent ) ) {
        if( _.isEmpty( wObject.parent ) ) {
            wObject.parent = '';
        } else {
            wObject.parent = wObject.parent[ 0 ];
            getRequiredFields( wObject.parent, REQUIREFIELDS_PARENT );
        }
    }
    let required_fields = [ ...REQUIREDFIELDS ];

    // format listItems field
    if ( await Wobj.isFieldExist( { author_permlink: data.author_permlink, fieldName: 'listItem' } ) ) {
        const { wobjects, sortCustom } = await Wobj.getList( data.author_permlink );
        const keyName = wObject.object_type.toLowerCase() === 'list' ? 'listItems' : 'menuItems';

        wObject[ keyName ] = wobjects;
        wObject.sortCustom = sortCustom;
        required_fields.push( 'sortCustom', 'listItem' );
    }
    // format gallery and adding rank of wobject
    wObject.preview_gallery = _.orderBy( wObject.fields.filter( ( field ) => field.name === 'galleryItem' ), [ 'weight' ], [ 'asc' ] ).slice( 0, 3 );
    wObject.albums_count = wObject.fields.filter( ( field ) => field.name === 'galleryAlbum' ).length;
    wObject.photos_count = wObject.fields.filter( ( field ) => field.name === 'galleryItem' ).length;

    // add rank for current Wobject
    await rankHelper.calculateWobjectRank( [ wObject ] ); // calculate rank for wobject
    wObject.followers_count = wObject.followers.length;
    delete wObject.followers;

    const { users } = await getExperts( { author_permlink: data.author_permlink, weight: wObject.weight } );

    wObject.users = users;

    if ( data.required_fields && ( ( Array.isArray( data.required_fields ) && data.required_fields.length && data.required_fields.every( _.isString ) ) || _.isString( data.required_fields ) ) ) {
        if ( _.isString( data.required_fields ) ) {
            required_fields.push( data.required_fields );
        } else {
            required_fields.push( ...data.required_fields );
        }
    } // add additional fields to returning

    // get only required fields for wobject, parent wobjects and child objects
    getRequiredFields( wObject, required_fields );
    if ( wObject.parent_objects ) {
        wObject.parent_objects.forEach( ( parent ) => getRequiredFields( parent, required_fields ) );
    }
    if ( wObject.child_objects ) {
        wObject.child_objects.forEach( ( child ) => getRequiredFields( child, required_fields ) );
    }

    if ( data.user ) {
        const { user = { weight: 0, name: data.user } } = await getExperts( { author_permlink: data.author_permlink, weight: wObject.weight, username: data.user } );

        wObject.user = user;
        wObject.user.rank = 0;
    }
    return { wobjectData: wObject };

};

const getRequiredFields = function ( wObject, requiredFields ) {
    wObject.fields = wObject.fields.filter( ( item ) => requiredFields.includes( item.name ) );
};

module.exports = {
    getOne
};
