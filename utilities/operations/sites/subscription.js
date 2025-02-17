const { App } = require('models');
const { createPayPalProduct } = require('utilities/operations/paypal/products');
const { createPayPalPlan } = require('utilities/operations/paypal/subscriptions');

const generateRequestId = () => `REQ-${crypto.randomUUID()}`;

const createBasicSubscriptionForWebsite = async ({ host }) => {
  const requestId = generateRequestId();

  // todo check product before creating in our base

  const { result, error } = await createPayPalProduct({
    requestId, name: host,
  });

  // if created save
  if (error) return { error };

  const { result: subPlan, error: planError } = await createPayPalPlan({
    requestId, productId: result.id,
  });

  if (planError) return { error: planError };

  return { result: subPlan };
};

const payPalBasicSubscription = async ({ userName, host }) => {
  const { result: app } = App.findOne({ host, owner: userName });
  if (!app) return { error: { status: 401, message: 'Not Authorized' } };

  const { result, error } = await createBasicSubscriptionForWebsite({ host });
  if (error) return { error };

  return { result };
};

// {
//   "id": "PROD-4TM73819GL539972D",
//   "name": "myhost.com",
//   "description": "web hosting",
//   "create_time": "2025-02-12T13:39:46Z",
//   "links": [
//   {
//     "href": "https://api.sandbox.paypal.com/v1/catalogs/products/PROD-4TM73819GL539972D",
//     "rel": "self",
//     "method": "GET"
//   },
//   {
//     "href": "https://api.sandbox.paypal.com/v1/catalogs/products/PROD-4TM73819GL539972D",
//     "rel": "edit",
//     "method": "PATCH"
//   }
// ]
// }

// {
//   "id": "P-3ES3921951582440TM6WKJMY",
//   "product_id": "PROD-4TM73819GL539972D",
//   "name": "Standard Monthly Subscription",
//   "status": "ACTIVE",
//   "description": "A standard subscription for $30 per month",
//   "usage_type": "LICENSED",
//   "create_time": "2025-02-12T13:40:03Z",
//   "links": [
//   {
//     "href": "https://api.sandbox.paypal.com/v1/billing/plans/P-3ES3921951582440TM6WKJMY",
//     "rel": "self",
//     "method": "GET",
//     "encType": "application/json"
//   },
//   {
//     "href": "https://api.sandbox.paypal.com/v1/billing/plans/P-3ES3921951582440TM6WKJMY",
//     "rel": "edit",
//     "method": "PATCH",
//     "encType": "application/json"
//   },
//   {
//     "href": "https://api.sandbox.paypal.com/v1/billing/plans/P-3ES3921951582440TM6WKJMY/deactivate",
//     "rel": "self",
//     "method": "POST",
//     "encType": "application/json"
//   }
// ]
// }

/// SUCSESS

// {
//   "orderID": "35N70380LR5035843",
//   "subscriptionID": "I-R78NHMNWKV04",
//   "facilitatorAccessToken": "A21AAJFoULalrnJ5Gpzl4QTE7Kz-XtX5dvu4JZtqKnC067jUrKfn1X2KiJ56QEkGXINMeE96WqVXv7-PjIBzVy5tGJHjVfEjA",
//   "paymentSource": "paypal"
// }

module.exports = {
  payPalBasicSubscription,
};
