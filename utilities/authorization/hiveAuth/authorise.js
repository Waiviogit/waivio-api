const CryptoJS = require('crypto-js');
const { parseJson } = require('../../helpers/jsonHelper');

const secretKey = process.env.HIVE_AUTH;

const decryptText = (ciphertext) => {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, secretKey);
    const decryptedMessage = bytes.toString(CryptoJS.enc.Utf8);
    return decryptedMessage;
  } catch (error) {
    return '';
  }
};

const authorise = ({ token, username }) => {
  const message = decryptText(token);
  const json = parseJson(message);

  return json.username === username && json.expire > Date.now();
};

module.exports = {
  authorise,
};
