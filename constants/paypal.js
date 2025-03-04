const PAYPAL_HOST = process.env.PAYPAL_HOST || 'api-m.sandbox.paypal.com';
const { PAYPAL_CLIENT_ID, PAYPAL_SECRET } = process.env;

module.exports = {
  PAYPAL_HOST,
  PAYPAL_CLIENT_ID,
  PAYPAL_SECRET,
};
