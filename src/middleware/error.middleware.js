import { ApiError } from '../utils/apiError.js';
import { ENV } from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
  let statusCode = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected error occurred';
  let details = [];

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details || [];
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid authentication token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Authentication token has expired';
  } else if (err.message) {
    message = err.message;
  }

  const errorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details.length > 0 && { details }),
      ...(ENV.NODE_ENV === 'development' && { stack: err.stack }),
    },
  };

  return res.status(statusCode).json(errorResponse);
};

export const notFoundHandler = (req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};
