import { ApiError } from '../utils/apiError.js';

/**
 * Basic schema validator helper for required fields in req.body
 * @param {string[]} requiredFields
 */
export const requireFields = (requiredFields = []) => {
  return (req, res, next) => {
    const missing = [];
    for (const field of requiredFields) {
      if (req.body[field] === undefined || req.body[field] === null || req.body[field] === '') {
        missing.push(field);
      }
    }

    if (missing.length > 0) {
      return next(
        ApiError.badRequest(`Missing required field(s): ${missing.join(', ')}`, missing)
      );
    }

    next();
  };
};
