const { PAYPAL_HOST } = require('../../../constants/paypal');
const { getPayPalAccessToken } = require('./auth');

const createPayPalPlan = async ({
  requestId, productId, priceUSD = '39',
}) => {
  const url = `https://${PAYPAL_HOST}/v1/billing/plans`;

  const payload = {
    product_id: productId,
    name: 'Standard Monthly Subscription',
    description: `A standard subscription for ${priceUSD} CAD per month`,
    billing_cycles: [
      {
        frequency: {
          interval_unit: process.env.NODE_ENV === 'staging' ? 'DAY' : 'MONTH',
          interval_count: 1,
        },
        tenure_type: 'REGULAR',
        sequence: 1,
        total_cycles: 0, // Auto-renew indefinitely
        pricing_scheme: {
          fixed_price: {
            value: priceUSD,
            currency_code: 'CAD',
          },
        },
      },
    ],
    payment_preferences: {
      auto_bill_outstanding: true,
      payment_failure_threshold: 3,
    },
    taxes: {
      percentage: '0',
      inclusive: false,
    },
  };

  try {
    const accessToken = await getPayPalAccessToken();
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
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
    return { result: data };
  } catch (error) {
    console.error('Error creating PayPal plan:', error);
    return { error };
  }
};

const getPayPalSubscriptionDetails = async ({ subscriptionId }) => {
  const url = `https://${PAYPAL_HOST}/v1/billing/subscriptions/${subscriptionId}`;

  try {
    const accessToken = await getPayPalAccessToken();
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    return { result: data };
  } catch (error) {
    console.error('Error fetching PayPal subscription:', error);
    return { error };
  }
};

const cancelPayPalSubscription = async ({ subscriptionId, requestId, reason }) => {
  const url = `https://${PAYPAL_HOST}/v1/billing/subscriptions/${subscriptionId}/cancel`;

  const payload = {
    reason,
  };

  try {
    const accessToken = await getPayPalAccessToken();
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        'PayPal-Request-Id': requestId,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return { result: { success: true, subscriptionId } };
  } catch (error) {
    console.error('Error cancel PayPal subscription:', error);
    return { error };
  }
};

const showPlanDetails = async (id) => {
  const url = `https://${PAYPAL_HOST}/v1/billing/plans/${id}`;

  try {
    const accessToken = await getPayPalAccessToken();
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    return { result: data };
  } catch (error) {
    console.error('Error fetching PayPal subscription:', error);
    return { error };
  }
};

module.exports = {
  createPayPalPlan,
  getPayPalSubscriptionDetails,
  cancelPayPalSubscription,
  showPlanDetails,
};
