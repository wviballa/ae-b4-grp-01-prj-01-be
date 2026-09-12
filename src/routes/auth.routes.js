import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { verifyJwt } from '../middleware/verifyJwt.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import { requireFields, validateRegistration } from '../middleware/validateReq.js';

const router = Router();

// Public Authentication
router.post(
  '/register',
  authRateLimiter,
  validateRegistration,
  authController.register
);

router.post(
  '/login',
  authRateLimiter,
  requireFields(['email', 'password']),
  authController.login
);

router.post(
  '/refresh-token',
  requireFields(['refreshToken']),
  authController.refreshToken
);

router.post('/logout', verifyJwt, authController.logout);

// Email Verification
router.get('/verify-email', authController.verifyEmail);
router.post(
  '/resend-verification',
  authRateLimiter,
  requireFields(['email']),
  authController.resendVerification
);

// Password Recovery (camelCase & kebab-case routes supported)
router.post(
  '/forgotPassword',
  authRateLimiter,
  requireFields(['email']),
  authController.forgotPassword
);
router.post(
  '/forgot-password',
  authRateLimiter,
  requireFields(['email']),
  authController.forgotPassword
);

router.post(
  '/resetPassword',
  authRateLimiter,
  requireFields(['token']),
  authController.resetPassword
);
router.post(
  '/reset-password',
  authRateLimiter,
  requireFields(['token']),
  authController.resetPassword
);

// Optional helper route for /api/v1/auth/me or /api/v1/auth/profile
router.get('/me', verifyJwt, authController.getProfile);
router.get('/profile', verifyJwt, authController.getProfile);

export default router;
