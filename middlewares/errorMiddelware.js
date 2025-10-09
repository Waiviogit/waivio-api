const Sentry = require('@sentry/node');

const errorMiddleware = (err, req, res, next) => {
  const message = err.message || 'Internal Server Error';
  const status = err.status || 500;

  res.locals.message = message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  console.error('Error middleware caught:', {
    message,
    status,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  if (status >= 500) {
    Sentry.captureException(err);
  }

  res.status(status).json({ message });
};

module.exports = errorMiddleware;
