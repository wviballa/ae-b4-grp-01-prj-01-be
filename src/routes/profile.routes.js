import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { verifyJwt } from '../middleware/verifyJwt.js';

const router = Router();

router.use(verifyJwt);

router.get('/', authController.getProfile);
router.put('/', authController.updateProfile);

export default router;
