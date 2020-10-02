const axios = require('axios');
const Sentry = require('@sentry/node');
const { sendSentryNotification } = require('utilities/helpers/sentryHelper');

exports.sendCustomJson = async (data, url) => {
  try {
    const result = await axios.post(url, data, { headers: { API_KEY: process.env.API_KEY } });
    return { result: result.status === 200 };
  } catch (error) {
    Sentry.captureException(error);
    await sendSentryNotification(error);
    return { error };
  }
};
