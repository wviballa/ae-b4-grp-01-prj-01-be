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

/**
 * Registration payload validator for email, password strength, and name
 */
export const validateRegistration = (req, res, next) => {
  const { email, password, fullName, name, firstName } = req.body || {};
  const errors = [];

  // 1. Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || typeof email !== 'string' || !email.trim()) {
    errors.push('Email is required.');
  } else if (!emailRegex.test(email.trim())) {
    errors.push('Please enter a valid email address.');
  }

  // 2. Password security validation
  if (!password || typeof password !== 'string') {
    errors.push('Password is required.');
  } else {
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long.');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter (A-Z).');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter (a-z).');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number (0-9).');
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Password must contain at least one special character (e.g. !@#$%^&*).');
    }
  }

  // 3. Name validation (accepts fullName, name, or firstName)
  const userProvidedName = (fullName || name || firstName || '').toString().trim();
  if (!userProvidedName) {
    errors.push('Full name or first name is required.');
  } else if (userProvidedName.length < 2) {
    errors.push('Name must be at least 2 characters long.');
  }

  if (errors.length > 0) {
    return next(ApiError.badRequest(errors.join(' '), errors));
  }

  next();
};

