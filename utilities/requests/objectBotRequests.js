const axios = require('axios');
const Sentry = require('@sentry/node');
const { sendSentryNotification } = require('utilities/helpers/sentryHelper');

exports.sendCustomJson = async (data, url, sendSentry = true) => {
  try {
    const result = await axios.post(url, data, { headers: { api_key: process.env.API_KEY } });
    return { result: result.data };
  } catch (error) {
    if (sendSentry) {
      Sentry.captureException(error);
      await sendSentryNotification(error);
    }
    return { error };
  }
};
