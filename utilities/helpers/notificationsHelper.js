const axios = require('axios');
const {
  HOST, BASE_URL, SET_NOTIFICATION,
} = require('constants/requestData').NOTIFICATIONS_API;
const Sentry = require('@sentry/node');
const { sendSentryNotification } = require('utilities/helpers/sentryHelper');

exports.sendNotification = async (reqData) => {
  const URL = HOST + BASE_URL + SET_NOTIFICATION;

  try {
    await axios.post(URL, reqData, { headers: { api_key: process.env.NOTIFICATIONS_KEY } });
  } catch (error) {
    Sentry.captureException(error);
    return sendSentryNotification(error);
  }
};
