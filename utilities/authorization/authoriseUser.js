const { WAIVIO_ADMINS_ENV } = require('../../constants/common');
const authoriseSteemconnect = require('./steemconnect/authorise');
const waivioAuthorise = require('./waivioAuth/authorise');
const keychainAuth = require('./keychain/authorise');
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

const VALIDATION_METHOD = {
  'hive-auth': hiveAuthorise.authorise,
  'hive-signer': authoriseSteemconnect.authoriseUser,
  'hive-keychain': keychainAuth.authorise,
  'waivio-auth': waivioAuthorise.authorise,
  default: () => false,
};

exports.authorise = async (username) => {
  const store = asyncLocalStorage.getStore();
  const accessToken = store.get('access-token');
  const authType = store.get('auth-type');
  const validationMethod = VALIDATION_METHOD[authType] || VALIDATION_METHOD.default;
  const isValidToken = await validationMethod(accessToken, username);
  return authoriseResponse(isValidToken, username);
};

exports.checkAdmin = async (name) => {
  if (WAIVIO_ADMINS_ENV.includes(name)) return { valid: true, error: null };

  return { valid: false, error: { status: 401, message: 'Your account does not have sufficient access rights' } };
};
