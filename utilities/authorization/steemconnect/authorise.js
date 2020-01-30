const sc2 = require('sc2-sdk');

/**
 * Authorise user using token of steemconnect
 * @param {string} token Valid token of steemconnect
 * @param {string} username User name for particular token
 * @returns {Boolean}  true if "token" valid for current "username", else false
 */
exports.authoriseUser = async (token = '', username = '') => {
  if (token === '') return false;
  const api = sc2.Initialize({
    accessToken: token,
  });
  let user;

  try {
    user = await api.me();
  } catch (error) {
    return false;
  }

  return user._id === username;
};
