const axios = require('axios');
const Sentry = require('@sentry/node');
const { telegramApi } = require('../../constants/requestData');
const { REQUEST_TIMEOUT } = require('../../constants/common');

exports.sendSentryNotification = async () => {
  try {
    if (!['staging', 'production'].includes(process.env.NODE_ENV)) return;
    const result = await axios.get(
      `${telegramApi.HOST}${telegramApi.BASE_URL}${telegramApi.SENTRY_ERROR}?app=waivioApi&env=${process.env.NODE_ENV}`,
      {
        timeout: REQUEST_TIMEOUT,
      },
    );
    return { result: result.data };
  } catch (error) {
    return { error };
  }
};

exports.captureException = async (error = {}) => {
  Sentry.captureException({ error });
  await this.sendSentryNotification();
  return false;
};
