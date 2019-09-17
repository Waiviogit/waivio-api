const { User } = require( '../../models' );
const _ = require( 'lodash' );

const getUserLocales = async ( user_name ) => {
    if( !user_name ) return {};
    try {
        const { user, error } = await User.getOne( user_name );
        if( error ) return { error };

        let user_locales = _.get( user, 'user_metadata.settings.postLocales', [] );
        // if postLocales is empty => use language of interface, if language of interface unset('auto') use default 'en-US' locale
        if( _.isEmpty( user_locales ) ) {
            user_locales = [ _.get( user, 'user_metadata.settings.locale', 'en-US' ) ].map( ( i ) => i === 'auto' ? 'en-US' : i );
        }
        return { user_locales };
    } catch ( error ) {
        return { error };
    }
};

module.exports = { getUserLocales };
