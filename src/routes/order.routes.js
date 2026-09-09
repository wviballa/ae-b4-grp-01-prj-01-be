import { Router } from 'express';
import { orderController } from '../controllers/order.controller.js';
import { verifyJwt } from '../middleware/verifyJwt.js';
import { requireFields } from '../middleware/validateReq.js';

const router = Router();

router.post(
  '/checkout-summary',
  verifyJwt,
  requireFields(['addressId']),
  orderController.getCheckoutSummary
);

router.post(
  '/',
  verifyJwt,
  requireFields(['addressId']),
  orderController.createOrder
);

router.get('/', verifyJwt, orderController.listUserOrders);
router.get('/:orderId', verifyJwt, orderController.getOrder);
router.get('/:orderId/receipt', verifyJwt, orderController.getOrderReceipt);

export default router;
