import { Router } from 'express';
import { orderController } from '../controllers/order.controller.js';
import { verifyJwt, optionalJwt } from '../middleware/verifyJwt.js';
import { requireFields } from '../middleware/validateReq.js';

const router = Router();

router.post(
  '/checkout-summary',
  optionalJwt,
  orderController.getCheckoutSummary
);

router.post(
  '/',
  optionalJwt,
  orderController.createOrder
);

router.get('/', verifyJwt, orderController.listUserOrders);
router.get('/:orderId', verifyJwt, orderController.getOrder);
router.get('/:orderId/receipt', verifyJwt, orderController.getOrderReceipt);

export default router;
