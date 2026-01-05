const morgan = require('morgan');
const cors = require('cors');
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const routes = require('./routes');
const middlewares = require('./middlewares');
const swaggerDocument = require('./swagger');
require('./utilities');

// Add global error handlers to catch unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  console.error('Unhandled rejection details:', {
    reason: reason?.message || reason,
    stack: reason?.stack,
    type: typeof reason,
    constructor: reason?.constructor?.name,
  });
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  console.error('Uncaught exception details:', {
    message: error.message,
    stack: error.stack,
    name: error.name,
  });
});

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
const morganFormat = process.env.MORGAN_FORMAT;
if (morganFormat) {
  const resolvedFormat = {
    custom: ':method :url :status :res[content-length] - :response-time ms',
    dev: 'dev',
    combined: 'combined',
    common: 'common',
    short: 'short',
    tiny: 'tiny',
  }[morganFormat] || morganFormat;
  app.use(morgan(resolvedFormat));
}
app.use(middlewares.contextMiddleware);
app.use(middlewares.reqRates.incrRate);
app.use(middlewares.siteUserStatistics.saveUserIp);
app.use(routes);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(middlewares.notFoundMiddleware);
app.use(middlewares.errorMiddleware);

module.exports = app;
