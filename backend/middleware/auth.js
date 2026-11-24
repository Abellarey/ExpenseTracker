const ApiError = require('../utils/apiError');
const env = require('../config/env');
const jwt = require('jsonwebtoken');

const protect = (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;

  if (!token) {
    return next(new ApiError(401, 'Please log in to continue.'));
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    if (!decoded.id) {
      return next(new ApiError(401, 'Your session is invalid. Please log in again.'));
    }
    req.user = { id: decoded.id };
    return next();
  } catch {
    return next(new ApiError(401, 'Your session has expired. Please log in again.'));
  }
};

module.exports = { protect };
