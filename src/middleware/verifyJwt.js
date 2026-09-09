import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { ApiError } from '../utils/apiError.js';

export const verifyJwt = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(ApiError.unauthorized('Authentication token is missing or malformed'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET);
    req.user = decoded; // { userId, email, role, ... }
    next();
  } catch (err) {
    next(err);
  }
};

export const optionalJwt = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, ENV.JWT_SECRET);
    req.user = decoded;
  } catch {
    // Optional token: ignore error and proceed as guest
  }

  next();
};
