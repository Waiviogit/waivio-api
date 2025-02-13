const { PAYPAL_HOST } = require('constants/paypal');
const { getPayPalAccessToken } = require('./auth');

const createPayPalProduct = async ({
  requestId, name, image_url, home_url,
}) => {
  const url = `https://${PAYPAL_HOST}/v1/catalogs/products`; // replace with real

  const payload = {
    name, // required   coffee.gifts
    description: 'web hosting',
    type: 'DIGITAL', // required   SERVICE
    category: 'WEB_HOSTING_AND_DESIGN', // ECOMMERCE_DEVELOPMENT , ECOMMERCE_SERVICES, WEB_HOSTING_AND_DESIGN, BUSINESS
    image_url,
    home_url,
  };

  try {
    const accessToken = await getPayPalAccessToken();

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'PayPal-Request-Id': requestId,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log('PayPal Product Created:', data);
    return { result: data };
  } catch (error) {
    console.error('Error creating PayPal product:', error);
    return { error };
  }
};

module.exports = {
  createPayPalProduct,
};
