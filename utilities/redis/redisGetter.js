const { wobjRefsClient, importUserClient } = require('utilities/redis/redis');

/**
 * Get assigned wobjects to post by post path("author" + "_" + "permlink")
 * @param path {String}
 * @returns {Promise<*>} Return array of wobjects(author_permlink with percent)
 */
exports.getWobjRefs = async (authorPermlink) => wobjRefsClient.hgetallAsync(authorPermlink);

/**
 * Get list of users which currently importing
 * @returns {Promise<*>} array of strings
 */
exports.getAllImportedUsers = async () => importUserClient.keysAsync('import_user:*');

exports.getImportedUser = async (userName) => importUserClient.getAsync(`import_user:${userName}`);
