const axios = require('axios');
const {
  HOST, BASE_URL, SET_NOTIFICATION, SET_SERVICE_NOTIFICATION,
} = require('../../constants/requestData').NOTIFICATIONS_API;
const Sentry = require('@sentry/node');
const { sendSentryNotification } = require('./sentryHelper');
const { REQUEST_TIMEOUT } = require('../../constants/common');

exports.sendNotification = async (reqData) => {
  const URL = HOST + BASE_URL + SET_NOTIFICATION;

  try {
    await axios.post(
      URL,
      reqData,
      {
        headers: { API_KEY: process.env.NOTIFICATIONS_KEY },
        timeout: REQUEST_TIMEOUT,
      },
    );
  } catch (error) {
    Sentry.captureException(error);
    return sendSentryNotification(error);
  }
};

exports.sendServiceNotification = async (reqData) => {
  const URL = HOST + BASE_URL + SET_SERVICE_NOTIFICATION;

  try {
    await axios.post(
      URL,
      reqData,
      {
        headers: { API_KEY: process.env.NOTIFICATIONS_KEY },
        timeout: REQUEST_TIMEOUT,
      },
    );
  } catch (error) {
    Sentry.captureException(error);
    return sendSentryNotification(error);
  }
};
