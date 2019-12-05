const { User, Post, App } = require( '../../../models' );
const _ = require( 'lodash' );

// TO DO: add resteems to selections by author
const getFeed = async function ( { name, limit = 20, skip = 0, user_languages, filter } ) {
    const { user, error: userError } = await User.getOne( name );

    if( userError || !user ) {
        return { error: userError || { status: 404, message: 'User not found!' } };
    }
    const { data: filtersData, error: filterError } = await getFiltersData( filter );
    if( filterError ) return{ error: filterError };


    let { posts, error: postsError } = await Post.getByFollowLists( {
        users: user.users_follow,
        author_permlinks: user.objects_follow,
        user_languages, skip, limit, filtersData
    } );
    if( postsError ) return { error: postsError };

    return { posts };
};

const getFiltersData = async ( filter ) => {
    const data = {};
    const byApp = _.get( filter, 'byApp' );
    if( _.isString( byApp ) && !_.isEmpty( byApp ) ) {
        const { app, error } = await App.getOne( { name: byApp } );
        if( error ) return{ error };
        data.require_wobjects = _.get( app, 'supported_objects', [] );
    }
    return { data };
};

module.exports = getFeed;
