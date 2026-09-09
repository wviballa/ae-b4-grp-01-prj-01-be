import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller.js';
import { verifyJwt } from '../middleware/verifyJwt.js';
import { requireFields } from '../middleware/validateReq.js';

const router = Router();

router.post(
  '/create-intent',
  verifyJwt,
  requireFields(['orderId']),
  paymentController.createIntent
);

router.post(
  '/webhook',
  requireFields(['transactionReference', 'status']),
  paymentController.webhook
);

export default router;
