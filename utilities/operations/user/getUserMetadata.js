const { User } = require( '../../../models' );

module.exports = async ( user_name ) => {
    // method updateOne find user and try to update it, but if user not exist - create and return created new user
    const { user, error } = await User.updateOne( { name: user_name } );

    if( error ) return { error };
    return { user_metadata: user.user_metadata };
};
