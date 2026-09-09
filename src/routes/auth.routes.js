import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { verifyJwt } from '../middleware/verifyJwt.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import { requireFields } from '../middleware/validateReq.js';

const router = Router();

// Public Authentication
router.post(
  '/register',
  authRateLimiter,
  requireFields(['email', 'password']),
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

// Optional helper route for /api/v1/auth/me or /api/v1/auth/profile
router.get('/me', verifyJwt, authController.getProfile);
router.get('/profile', verifyJwt, authController.getProfile);

export default router;
