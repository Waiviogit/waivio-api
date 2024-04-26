const { getNamespace } = require('cls-hooked');
const authoriseSteemconnect = require('./steemconnect/authorise');
const waivioAuthorise = require('./waivioAuth/authorise');
const hiveAuthorise = require('./hiveAuth/authorise');

/**
 * Authorise particular user with "access-token" from session(if it exist)
 * and set "authorised_user" to current session
 * @param username Name of user(steem, facebook, google etc.)
 * @returns {Promise<{error: {message: string, status: number}}|{isValid: boolean}>}
 * Return {isValid: true} if user authorised successfully,
 * or {error} if Token not exist or not valid
 */

const authoriseResponse = (valid, username) => {
  const session = getNamespace('request-session');
  if (valid) {
    session.set('authorised_user', username);
    return { isValid: true };
  }

  return { error: { status: 401, message: 'The Waivio authorization token is invalid!' } };
};

exports.authorise = async (username) => {
  const session = getNamespace('request-session');
  const accessToken = session.get('access-token');
  const hiveAuth = session.get('hive-auth');
  const isWaivioAuth = session.get('waivio-auth');

  if (isWaivioAuth) {
    const isValidToken = await waivioAuthorise.authorise(username, accessToken);
    return authoriseResponse(isValidToken, username);
  }
  if (hiveAuth) {
    const isValidToken = hiveAuthorise.authorise({ token: accessToken, username });
    return authoriseResponse(isValidToken, username);
  }
  if (accessToken && !hiveAuth) {
    const isValidToken = await authoriseSteemconnect.authoriseUser(accessToken, username);
    return authoriseResponse(isValidToken, username);
  }
  return { error: { status: 401, message: 'The Waivio authorization token is invalid' } };
};
