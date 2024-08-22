const Sentry = require('@sentry/node');
const Tracing = require('@sentry/tracing');

const getSentryOptions = (app) => ({
  environment: process.env.NODE_ENV,
  dsn: process.env.SENTRY_DNS,
  integrations: [
    // enable HTTP calls tracing
    new Sentry.Integrations.Http({ tracing: true }),
    // enable Express.js middleware tracing
    new Tracing.Integrations.Express({ app }),
  ],
});

module.exports = {
  getSentryOptions,
};
