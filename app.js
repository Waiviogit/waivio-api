const morgan = require('morgan');
const cors = require('cors');
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const routes = require('./routes');
const middlewares = require('./middlewares');
const swaggerDocument = require('./swagger');
require('./utilities');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));
if (process.env.NODE_ENV === 'staging') app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));
app.use(middlewares.contextMiddleware);
app.use(middlewares.reqRates.incrRate);
app.use(middlewares.siteUserStatistics.saveUserIp);
app.use(routes);
app.get('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
// Last middleware which send data from "res.result.json" to client
// eslint-disable-next-line no-unused-vars
app.use((req, res, next) => {
  res.status(res?.result?.status || 200).json(res?.result?.json);
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
