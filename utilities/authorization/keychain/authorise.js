// eslint-disable-next-line camelcase
const { waivio_auth } = require('../../../config');

const VALIDATE_TOKEN_URL = `https://${waivio_auth.host}/${waivio_auth.baseUrl}/hive/me`;

const validateTokenRequest = async (token) => {
  try {
    const res = await fetch(VALIDATE_TOKEN_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(`Me request failed: HTTP ${res.status}`);
    }

    return { result: body };
  } catch (error) {
    return { error };
  }
};

/**
 * Authorise user using token of waivioAuthService
 * @param {string} token Valid waivio-auth token
 * @param {string} username User name for particular token
 * @returns Promise{Boolean}  true if "token" valid for current "username", else false
 */
exports.authorise = async (token = '', username = '') => {
  const { result, error } = await validateTokenRequest(token);

  if (error) return false;
  return result?.username === username && result?.exp > Date.now() / 1000;
};
