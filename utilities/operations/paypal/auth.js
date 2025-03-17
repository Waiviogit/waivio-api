const { PAYPAL_HOST, PAYPAL_CLIENT_ID, PAYPAL_SECRET } = require('../../../constants/paypal');

const getPayPalAccessTokenRest = async ({ clientId, clientSecret }) => {
  const url = `https://${PAYPAL_HOST}/v1/oauth2/token`;
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${credentials}`,
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    return {
      token: data.access_token,
      expiresInSec: data.expires_in,
    };
  } catch (error) {
    console.error('Error obtaining PayPal access token:', error);
  }
};

const getPayPalAccessToken = async () => {
  // todo save to redis expires in
  const { token } = await getPayPalAccessTokenRest({
    clientId: PAYPAL_CLIENT_ID,
    clientSecret: PAYPAL_SECRET,
  });

  if (!token) throw new Error('Error get paypal accessToken');

  return token;
};

module.exports = {
  getPayPalAccessToken,
};
