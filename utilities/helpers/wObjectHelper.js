const _ = require( 'lodash' );
const { UserWobjects } = require( '../../database' ).models;

const formatRequireFields = function ( wObject, locale, requireFields ) {
    const temp = _.reduce( wObject.fields, ( resArr, field ) => {
        const currResField = resArr.find( ( item ) => item.name === field.name );

        if ( currResField && ( !currResField.weight || currResField.weight < field.weight ) ) {
            resArr = resArr.map( ( item ) => item.name === field.name ? field : item );
        }
        return resArr;
    }, requireFields ).filter( ( item ) => !_.isNil( item.weight ) );

    wObject.fields = _.reduce( wObject.fields, ( resArr, field ) => {
        const currResField = resArr.find( ( item ) => item.name === field.name );

        if ( currResField ) {
            if ( currResField.locale !== locale && field.locale === locale ) {
                resArr = resArr.map( ( item ) => item.name === field.name ? field : item );
            } else if ( currResField.locale === locale && currResField.weight < field.weight && field.locale === locale ) {
                resArr = resArr.map( ( item ) => item.name === field.name ? field : item );
            }
        }
        return resArr;
    }, temp );
}; // get best fields(avatarImage, name, location and link) in locale, or just best field if is have no field in locale

const getUserSharesInWobj = async ( name, author_permlink ) => {
    const userObjectShare = await UserWobjects.findOne( { user_name: name, author_permlink } ).select( '-_id weight' ).lean();

    return _.get( userObjectShare, 'weight' ) || 0;
};


module.exports = { formatRequireFields, getUserSharesInWobj };
