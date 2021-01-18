const express = require('express');
const Tracing = require('@sentry/tracing');
const morgan = require('morgan');
const cors = require('cors');
const Sentry = require('@sentry/node');
const swaggerUi = require('swagger-ui-express');
const bodyParser = require('body-parser');
const { createNamespace } = require('cls-hooked');
const { routes } = require('routes');
const {
  moderateWobjects, checkUserFollowers, fillPostAdditionalInfo, siteUserStatistics,
  checkUserFollowings, checkObjectsFollowings, checkBellNotifications,
} = require('middlewares');
const { sendSentryNotification } = require('utilities/helpers/sentryHelper');

const swaggerDocument = require('./swagger');
require('jobs');

const session = createNamespace('request-session');
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use((req, res, next) => {
  session.run(() => next());
});
app.use(cors());
app.use(morgan('dev'));

Sentry.init({
  environment: process.env.NODE_ENV,
  dsn: process.env.SENTRY_DNS,
  integrations: [
    // enable HTTP calls tracing
    new Sentry.Integrations.Http({ tracing: true }),
    // enable Express.js middleware tracing
    new Tracing.Integrations.Express({ app }),
  ],
});

process.on('unhandledRejection', (error) => {
  sendSentryNotification();
  Sentry.captureException(error);
});

// write to store user steemconnect/waivioAuth access_token if it exist
app.use((req, res, next) => {
  let { origin, host } = req.headers;
  if (origin) {
    origin = origin.replace('www.', '').replace('https://', '').replace('http://', '');
  } else origin = host;

  session.set('host', origin);
  session.set('access-token', req.headers['access-token']);
  session.set('waivio-auth', Boolean(req.headers['waivio-auth']));
  next();
});
app.use(Sentry.Handlers.requestHandler({ request: true, user: true }));
app.use('/', siteUserStatistics.saveUserIp);
app.use('/', routes);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// fill posts by some additional information(author wobj.weight, or wobjects info)
app.use('/', fillPostAdditionalInfo.fill);

// Moderate wobjects depend on app moderators before send
app.use('/', moderateWobjects.moderate);

// Check users for followers for some routes
app.use('/', checkUserFollowers.check);

// Check users for followings for some routes
app.use('/', checkUserFollowings.check);

// Check users for bell notifications
app.use('/', checkBellNotifications.check);

// Check objects for followings for some routes
app.use('/', checkObjectsFollowings.check);

app.use(Sentry.Handlers.errorHandler({
  shouldHandleError(error) {
    // Capture 500 errors
    if (error.status >= 500) {
      sendSentryNotification();
      return true;
    }
    return false;
  },
}));

// Last middleware which send data from "res.result.json" to client
// eslint-disable-next-line no-unused-vars
app.use((req, res, next) => {
  res.status(res.result.status || 200).json(res.result.json);
});

// middleware for handle error for each request
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  // render the error page
  res.status(err.status || 500).json({ message: err.message });
});

module.exports = app;
