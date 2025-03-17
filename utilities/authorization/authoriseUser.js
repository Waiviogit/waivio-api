const { WAIVIO_ADMINS_ENV } = require('../../constants/common');
const authoriseSteemconnect = require('./steemconnect/authorise');
const waivioAuthorise = require('./waivioAuth/authorise');
const hiveAuthorise = require('./hiveAuth/authorise');
const asyncLocalStorage = require('../../middlewares/context/context');

/**
 * Authorise particular user with "access-token" from session(if it exist)
 * and set "authorised_user" to current session
 * @param username Name of user(steem, facebook, google etc.)
 * @returns {Promise<{error: {message: string, status: number}}|{isValid: boolean}>}
 * Return {isValid: true} if user authorised successfully,
 * or {error} if Token not exist or not valid
 */

const authoriseResponse = (valid, username) => {
  const store = asyncLocalStorage.getStore();

  if (valid) {
    store.set('authorised_user', username);
    return { isValid: true };
  }

  return { error: { status: 401, message: 'The Waivio authorization token is invalid!' } };
};

exports.authorise = async (username) => {
  const store = asyncLocalStorage.getStore();

  const accessToken = store.get('access-token');
  const hiveAuth = store.get('hive-auth');
  const isWaivioAuth = store.get('waivio-auth');

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

exports.checkAdmin = async (name) => {
  if (WAIVIO_ADMINS_ENV.includes(name)) return { valid: true, error: null };

  return { valid: false, error: { status: 401, message: 'Your account does not have sufficient access rights' } };
};
