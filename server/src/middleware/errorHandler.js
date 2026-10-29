function errorHandler(err, req, res, next) {
  // Centralized error handling
  const status = err.status || 500;
  const message = err.message || 'Internal server error';

  // Do not expose stack traces or raw database credentials to client
  res.status(status).json({
    error: {
      message,
      status,
      code: err.code || null,
      details: err.linkedCount ? { linkedRecords: err.linkedCount } : undefined
    }
  });
}

module.exports = errorHandler;

