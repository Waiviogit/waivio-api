const notFoundMiddleware = (req, res, next) => {
  next({ status: 404, message: 'Not Found' });
};

module.exports = notFoundMiddleware;
