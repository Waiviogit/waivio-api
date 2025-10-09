const Sentry = require('@sentry/node');

const errorMiddleware = (err, req, res, next) => {
  const message = err.message || 'Internal Server Error';
  const status = err.status || 500;

  res.locals.message = message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // Enhanced error logging to capture more details
  console.error('Error middleware caught:', {
    message,
    status,
    stack: err.stack,
    url: req.url,
    method: req.method,
    errorType: err.name || typeof err,
    errorConstructor: err.constructor?.name,
    originalError: err,
    requestBody: req.body ? JSON.stringify(req.body).substring(0, 500) : 'N/A',
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
  });

  // If it's a generic error without stack, log the full error object
  if (!err.stack && status >= 500) {
    console.error('Full error object for debugging:', {
      errorKeys: Object.keys(err),
      errorValues: Object.values(err),
      errorString: String(err),
      errorJSON: JSON.stringify(err, Object.getOwnPropertyNames(err)),
    });
  }

  if (status >= 500) {
    Sentry.captureException(err);
  }

  res.status(status).json({ message });
};

module.exports = errorMiddleware;
