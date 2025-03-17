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

module.exports = {
  payPalBasicSubscription,
};
