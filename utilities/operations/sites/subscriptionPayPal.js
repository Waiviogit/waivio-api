const _ = require('lodash');
const moment = require('moment');
const {
  App, PayPalProductModel, PayPalPlanModel, PayPalSubscriptionModel,
} = require('../../../models');
const {
  STATUSES, BILLING_TYPE,
} = require('../../../constants/sitesConstants');
const { createPayPalProduct } = require('../paypal/products');
const { createPayPalPlan, getPayPalSubscriptionDetails, cancelPayPalSubscription } = require('../paypal/subscriptions');
const authoriseUser = require('../../authorization/authoriseUser');

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
  const { result: app } = await App.findOne({ host, owner: userName, status: STATUSES.ACTIVE });
  if (!app) return { error: { status: 401, message: 'Not Authorized' } };

  const { result, error } = await createBasicSubscriptionForWebsite({ host });
  if (error) return { error };

  return { result };
};

const activeSubscription = async ({ subscriptionId, host, userName }) => {
  const { result: subApp } = await App.findOne({ host, owner: userName, status: STATUSES.ACTIVE });
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

const getSubscriptionByHost = async ({ host }) => {
  const { result: product } = await PayPalProductModel.findOneByName(host);
  if (!product) return { error: { status: 404, message: 'Subscription product not found' } };
  const { result: subscription } = await PayPalSubscriptionModel.findOne({
    filter: {
      status: SUBSCRIPTION_STATUS.ACTIVE,
      product_id: product.id,
    },
  });
  if (!subscription) return { error: { status: 404, message: 'Subscription not found' } };

  const { result, error } = await getPayPalSubscriptionDetails({ subscriptionId: subscription.id });
  if (error) return { error };
  return { result };
};

/*
Method for checking subscription from cron-job service
 */
const checkActiveSubscriptionByHost = async ({ host }) => {
  // todo add sentry capture
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
  if (error) return { result: false };

  const valid = validateSubscription(result);
  if (!valid) {
    await PayPalSubscriptionModel.updateOne({
      filter: { id: subscription.id },
      update: { status: SUBSCRIPTION_STATUS.EXPIRED },
    });
    await App.findOneAndUpdate({ host: product.name }, { billingType: BILLING_TYPE.CRYPTO });
  }

  return { result: valid };
};

const cancelSubscriptionByHost = async ({ host, reason, userName }) => {
  const { valid: adminUser } = await authoriseUser.checkAdmin(userName);
  const { result: app } = await App.findOne({ host, owner: userName });
  if (!adminUser && !app) return { error: { status: 401, message: 'Not Authorised' } };

  const { result: product } = await PayPalProductModel.findOneByName(host);
  if (!product) return { error: { status: 404, message: 'Subscription product not found' } };
  const { result: subscription } = await PayPalSubscriptionModel.findOne({
    filter: {
      status: SUBSCRIPTION_STATUS.ACTIVE,
      product_id: product.id,
    },
  });
  if (!subscription) return { error: { status: 404, message: 'Subscription not found' } };

  const { result, error } = await cancelPayPalSubscription({
    subscriptionId: subscription.id,
    reason,
    requestId: generateRequestId(),
  });
  if (error) return { error };
  return { result };
};

module.exports = {
  payPalBasicSubscription,
  activeSubscription,
  getSubscriptionIdByHost,
  checkActiveSubscriptionByHost,
  getSubscriptionByHost,
  cancelSubscriptionByHost,
};
