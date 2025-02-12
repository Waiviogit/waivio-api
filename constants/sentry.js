const Sentry = require('@sentry/node');

const getSentryOptions = () => ({
  environment: process.env.NODE_ENV,
  dsn: process.env.SENTRY_DNS,
  integrations: [
    Sentry.httpIntegration(),
  ],
  tracesSampleRate: 1.0,
});

module.exports = {
  getSentryOptions,
};
