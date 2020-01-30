const { wobjRefsClient, importUserClient } = require( './redis' );

/**
 * Get assigned wobjects to post by post path("author" + "_" + "permlink")
 * @param path {String}
 * @returns {Promise<*>} Return array of wobjects(author_permlink with percent)
 */
exports.getWobjRefs = async ( path ) => {
    const res = await wobjRefsClient.hgetallAsync( path );
    return res;
}; // get wobjects references, if post_with_wobj - list of wobjects, else if append_obj - root object of append object

/**
 * Get list of users which currently importing
 * @returns {Promise<*>} array of strings
 */
exports.getAllImportedUsers = async () => {
    const res = await importUserClient.keysAsync( 'import_user:*' );
    return res;
};

exports.getImportedUser = async ( userName ) => {
    const res = await importUserClient.getAsync( `import_user:${userName}` );
    return res;
};
