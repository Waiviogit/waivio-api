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
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(middlewares.notFoundMiddleware);
app.use(middlewares.errorMiddleware);


module.exports = app;
