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
    timestamp: new Date().toISOString(),
  });

  // Log additional details for 5xx errors
  if (status >= 500) {
    console.error('Server error details:', {
      errorType: err.name || typeof err,
      errorConstructor: err.constructor?.name,
      originalError: err.originalError ? 'Present' : 'None',
    });
  }

  if (status >= 500) {
    Sentry.captureException(err);
  }

  res.status(status).json({ message });
};

module.exports = errorMiddleware;
