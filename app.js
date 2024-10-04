const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const Sentry = require('@sentry/node');
const swaggerUi = require('swagger-ui-express');
const routes = require('routes');
const middlewares = require('middlewares');
const { sendSentryNotification } = require('utilities/helpers/sentryHelper');

const swaggerDocument = require('./swagger');
require('./utilities');
const { getSentryOptions } = require('./constants/sentry');

const app = express();
Sentry.init(getSentryOptions(app));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));
if (process.env.NODE_ENV === 'staging') app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));
app.use(middlewares.contextMiddleware);
app.use(Sentry.Handlers.requestHandler({ request: true, user: true }));
app.use('/', middlewares.reqRates.incrRate);
app.use('/', middlewares.siteUserStatistics.saveUserIp);
app.use('/', routes);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(Sentry.Handlers.errorHandler({
  shouldHandleError(error) {
    // Capture 500 errors
    return error.status >= 500;
  },
}));
process.on('unhandledRejection', (error) => {
  sendSentryNotification();
  Sentry.captureException(error);
});

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
  console.log(err?.stack);
  res.status(err.status || 500).json({ message: err.message });
});

module.exports = app;
