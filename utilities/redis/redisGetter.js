const { wobjRefsClient, importUserClient } = require('utilities/redis/redis');

/**
 * Get assigned wobjects to post by post path("author" + "_" + "permlink")
 * @param path {String}
 * @returns {Promise<*>} Return array of wobjects(author_permlink with percent)
 */
exports.getWobjRefs = async function (author_permlink) {
  const res = await wobjRefsClient.hgetallAsync(author_permlink);

  return res;
};

/**
 * Get list of users which currently importing
 * @returns {Promise<*>} array of strings
 */
exports.getAllImportedUsers = async () => {
  const res = await importUserClient.keysAsync('import_user:*');
  return res;
};

exports.getImportedUser = async (userName) => {
  const res = await importUserClient.getAsync(`import_user:${userName}`);
  return res;
};
