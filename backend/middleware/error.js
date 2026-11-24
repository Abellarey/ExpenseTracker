const ApiError = require('../utils/apiError');

const notFound = (req, _res, next) => {
  next(new ApiError(404, `Route ${req.method} ${req.originalUrl} was not found.`));
};

const errorHandler = (error, _req, res, _next) => {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Something went wrong. Please try again.';
  let details = error.details || [];

  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Please correct the highlighted fields.';
    details = Object.values(error.errors).map((item) => ({ field: item.path, message: item.message }));
  }

  if (error.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for ${error.path}.`;
    details = [];
  }

  if (error.code === 11000) {
    statusCode = 409;
    message = 'That value is already in use. Please choose another one.';
    details = [{ field: Object.keys(error.keyPattern || {})[0] || 'value', message: 'Already exists.' }];
  }

  res.status(statusCode).json({
    success: false,
    message,
    errors: details,
    ...(statusCode === 500 ? { stack: process.env.NODE_ENV === 'development' ? error.stack : undefined } : {}),
  });
};

module.exports = { notFound, errorHandler };
