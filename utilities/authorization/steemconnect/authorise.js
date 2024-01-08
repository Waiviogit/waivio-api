const axios = require('axios');

const authoriseRequest = async (token) => {
  try {
    const response = await axios.get(
      'https://hivesigner.com/api/me',
      {
        headers: {
          Authorization: token,
        },
        timeout: 5000,
      },
    );

    return response?.data?._id;
  } catch (error) {
    return '';
  }
};

/**
 * Authorise user using token of steemconnect
 * @param {string} token Valid token of steemconnect
 * @param {string} username User name for particular token
 * @returns {Boolean}  true if "token" valid for current "username", else false
 */
exports.authoriseUser = async (token = '', username = '') => {
  if (!token || token === '') return false;

  const user = await authoriseRequest(token);

  return user === username;
};
