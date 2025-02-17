const {
  App, PayPalProductModel, PayPalPlanModel, PayPalSubscriptionModel,
} = require('models');
const {
  STATUSES, BILLING_TYPE,
} = require('constants/sitesConstants');
const _ = require('lodash');
const moment = require('moment');
const { createPayPalProduct } = require('utilities/operations/paypal/products');
const { createPayPalPlan, getPayPalSubscriptionDetails } = require('utilities/operations/paypal/subscriptions');

const generateRequestId = () => `REQ-${crypto.randomUUID()}`;

const SUBSCRIPTION_STATUS = {
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
};

const validateSubscription = (subscription) => {
  if (subscription.status === SUBSCRIPTION_STATUS.ACTIVE) return true;
  return moment(subscription?.billing_info?.last_payment?.time).add(30, 'days').isAfter(moment());
};

const findOrCreateProduct = async ({ host, requestId }) => {
  const { result: existProduct } = await PayPalProductModel.findOneByName(host);
  if (existProduct) return { result: existProduct };
  const { result, error } = await createPayPalProduct({
    requestId, name: host,
  });
  if (error) return { error };
  await PayPalProductModel.create(_.pick(result, ['id', 'name', 'description', 'create_time']));
  return { result };
};

const findOrCreatePlan = async ({ host, requestId }) => {
  const { result: existProduct } = await PayPalProductModel.findOneByName(host);
  if (!existProduct) return { error: { status: 404, message: 'Product not Found' } };

  const { result: existPlan } = await PayPalPlanModel.findOneByProductId(existProduct.id);
  if (existPlan) {
    const { result: activeSubscription } = await PayPalSubscriptionModel.findOne({
      filter: {
        status: SUBSCRIPTION_STATUS.ACTIVE,
        plan_id: existPlan.id,
        product_id: existProduct.id,
      },
    });
    if (activeSubscription) {
      return { error: { status: 422, message: 'active subscription exist' } };
    }
    // add additional info start time expired status
    return { result: existPlan };
  }

  const { result: subPlan, error: planError } = await createPayPalPlan({
    requestId, productId: existProduct.id,
  });
  if (planError) return { error: planError };

  await PayPalPlanModel.create(_.pick(
    subPlan,
    [
      'id',
      'product_id',
      'name',
      'status',
      'description',
      'usage_type',
      'create_time',
    ],
  ));
  return { result: subPlan };
};

const createBasicSubscriptionForWebsite = async ({ host }) => {
  const requestId = generateRequestId();
  const { result, error } = await findOrCreateProduct({ host, requestId });
  if (error) return { error };

  const { result: subPlan, error: planError } = await findOrCreatePlan({
    requestId, host,
  });

  if (planError) return { error: planError };

  return { result: subPlan };
};

const payPalBasicSubscription = async ({ userName, host }) => {
  const { result: app } = App.findOne({ host, owner: userName, status: STATUSES.ACTIVE });
  if (!app) return { error: { status: 401, message: 'Not Authorized' } };

  const { result, error } = await createBasicSubscriptionForWebsite({ host });
  if (error) return { error };

  return { result };
};

const activeSubscription = async ({ subscriptionId, host, userName }) => {
  const { result: subApp } = App.findOne({ host, owner: userName, status: STATUSES.ACTIVE });
  if (!subApp) return { error: { status: 401, message: 'Not Authorized' } };

  const { result, error } = await getPayPalSubscriptionDetails({ subscriptionId });
  if (error) return { error };
  const valid = validateSubscription(result);
  if (!valid) return { error: { status: 401, message: 'Subscription expired' } };

  const { result: plan } = await PayPalPlanModel.findOneById(result.plan_id);
  if (!plan) return { error: { status: 404, message: 'Subscription plan not found' } };

  const { result: subscription, error: subError } = await PayPalSubscriptionModel.create({
    ..._.pick(result, ['id', 'plan_id']),
    product_id: plan.product_id,
  });
  if (subError) return { error: subError };
  const { result: product } = await PayPalProductModel.findOneById(plan.product_id);
  if (!product) return { error: { status: 404, message: 'Subscription product not found' } };

  const { result: app } = await App
    .findOneAndUpdate({ host: product.name }, { billingType: BILLING_TYPE.PAYPAL_SUBSCRIPTION });

  if (app?.billingType !== BILLING_TYPE.PAYPAL_SUBSCRIPTION) {
    return { error: { status: 500, message: 'Failed to update app subscription' } };
  }

  return { result: subscription };
};

const getSubscriptionIdByHost = async ({ host }) => {
  const { result: product } = await PayPalProductModel.findOneByName(host);
  if (!product) return { error: { status: 404, message: 'Subscription product not found' } };
  const { result: subscription } = await PayPalSubscriptionModel.findOne({
    filter: {
      status: SUBSCRIPTION_STATUS.ACTIVE,
      product_id: product.id,
    },
  });
  if (!subscription) return { error: { status: 404, message: 'Subscription not found' } };

  return { result: subscription.id };
};

/*
Method for checking subscription from cron-job service
 */
const checkActiveSubscriptionByHost = async ({ host }) => {
  const { result: product } = await PayPalProductModel.findOneByName(host);
  if (!product) return { result: false };
  const { result: subscription } = await PayPalSubscriptionModel.findOne({
    filter: {
      status: SUBSCRIPTION_STATUS.ACTIVE,
      product_id: product.id,
    },
  });
  if (!subscription) return { result: false };
  const { result, error } = await getPayPalSubscriptionDetails({ subscriptionId: subscription.id });
  // todo retry
  if (error) return { result: false };

  const valid = validateSubscription(result);
  if (!valid) {
    // todo update one expired
    await PayPalSubscriptionModel.updateOne({
      filter: { id: subscription.id },
      update: { status: SUBSCRIPTION_STATUS.EXPIRED },
    });
  }

  return { result: valid };
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

/// front response SUCSESS

// {
//   "orderID": "35N70380LR5035843",
//   "subscriptionID": "I-R78NHMNWKV04",
//   "facilitatorAccessToken": "A21AAJFoULalrnJ5Gpzl4QTE7Kz-XtX5dvu4JZtqKnC067jUrKfn1X2KiJ56QEkGXINMeE96WqVXv7-PjIBzVy5tGJHjVfEjA",
//   "paymentSource": "paypal"
// }

// SUBSCRIPTION BY ID REQUEST

// {
//   "status": "ACTIVE",
//   "status_update_time": "2025-02-12T13:55:55Z",
//   "id": "I-R78NHMNWKV04",
//   "plan_id": "P-3ES3921951582440TM6WKJMY",
//   "start_time": "2025-02-12T13:51:51Z",
//   "quantity": "1",
//   "shipping_amount": {
//   "currency_code": "USD",
//     "value": "0.0"
// },
//   "subscriber": {
//   "email_address": "sb-h2ro429166820@personal.example.com",
//     "payer_id": "QAVCLENE6HZNW",
//     "name": {
//     "given_name": "John",
//       "surname": "Doe"
//   },
//   "shipping_address": {
//     "address": {
//       "address_line_1": "1 Main St",
//         "admin_area_2": "San Jose",
//         "admin_area_1": "CA",
//         "postal_code": "95131",
//         "country_code": "US"
//     }
//   }
// },
//   "billing_info": {
//   "outstanding_balance": {
//     "currency_code": "USD",
//       "value": "0.0"
//   },
//   "cycle_executions": [
//     {
//       "tenure_type": "REGULAR",
//       "sequence": 1,
//       "cycles_completed": 1,
//       "cycles_remaining": 0,
//       "current_pricing_scheme_version": 1,
//       "total_cycles": 0
//     }
//   ],
//     "last_payment": {
//     "amount": {
//       "currency_code": "USD",
//         "value": "30.0"
//     },
//     "time": "2025-02-12T13:55:54Z"
//   },
//   "next_billing_time": "2025-03-12T10:00:00Z",
//     "failed_payments_count": 0
// },
//   "create_time": "2025-02-12T13:53:16Z",
//   "update_time": "2025-02-12T13:55:55Z",
//   "plan_overridden": false,
//   "links": [
//   {
//     "href": "https://api.sandbox.paypal.com/v1/billing/subscriptions/I-R78NHMNWKV04/cancel",
//     "rel": "cancel",
//     "method": "POST"
//   },
//   {
//     "href": "https://api.sandbox.paypal.com/v1/billing/subscriptions/I-R78NHMNWKV04",
//     "rel": "edit",
//     "method": "PATCH"
//   },
//   {
//     "href": "https://api.sandbox.paypal.com/v1/billing/subscriptions/I-R78NHMNWKV04",
//     "rel": "self",
//     "method": "GET"
//   },
//   {
//     "href": "https://api.sandbox.paypal.com/v1/billing/subscriptions/I-R78NHMNWKV04/suspend",
//     "rel": "suspend",
//     "method": "POST"
//   },
//   {
//     "href": "https://api.sandbox.paypal.com/v1/billing/subscriptions/I-R78NHMNWKV04/capture",
//     "rel": "capture",
//     "method": "POST"
//   }
// ]
// }

// const ss = {
//   status: 'CANCELLED',
//   status_update_time: '2025-02-14T13:19:37Z',
//   id: 'I-R78NHMNWKV04',
//   plan_id: 'P-3ES3921951582440TM6WKJMY',
//   start_time: '2025-02-12T13:51:51Z',
//   quantity: '1',
//   shipping_amount: {
//     currency_code: 'USD',
//     value: '0.0',
//   },
//   subscriber: {
//     email_address: 'sb-h2ro429166820@personal.example.com',
//     payer_id: 'QAVCLENE6HZNW',
//     name: {
//       given_name: 'John',
//       surname: 'Doe',
//     },
//     shipping_address: {
//       address: {
//         address_line_1: '1 Main St',
//         admin_area_2: 'San Jose',
//         admin_area_1: 'CA',
//         postal_code: '95131',
//         country_code: 'US',
//       },
//     },
//   },
//   billing_info: {
//     outstanding_balance: {
//       currency_code: 'USD',
//       value: '0.0',
//     },
//     cycle_executions: [
//       {
//         tenure_type: 'REGULAR',
//         sequence: 1,
//         cycles_completed: 1,
//         cycles_remaining: 0,
//         current_pricing_scheme_version: 1,
//         total_cycles: 0,
//       },
//     ],
//     last_payment: {
//       amount: {
//         currency_code: 'USD',
//         value: '30.0',
//       },
//       time: '2025-02-12T13:55:54Z',
//     },
//     failed_payments_count: 0,
//   },
//   create_time: '2025-02-12T13:53:16Z',
//   update_time: '2025-02-14T13:19:37Z',
//   plan_overridden: false,
//   links: [
//     {
//       href: 'https://api.sandbox.paypal.com/v1/billing/subscriptions/I-R78NHMNWKV04',
//       rel: 'self',
//       method: 'GET',
//     },
//   ],
//
// };


module.exports = {
  payPalBasicSubscription,
  activeSubscription,
  getSubscriptionIdByHost,
  checkActiveSubscriptionByHost,
};
