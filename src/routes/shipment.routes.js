import { Router } from 'express';
import { shipmentController } from '../controllers/shipment.controller.js';
import { verifyJwt } from '../middleware/verifyJwt.js';

const router = Router();

// Public shipment tracking by tracking number
router.get('/track/:trackingNumber', shipmentController.trackShipment);

// Customer order shipment tracking
router.get('/orders/:orderId', verifyJwt, shipmentController.getOrderShipment);
router.get('/:orderId', verifyJwt, shipmentController.getOrderShipment);

export default router;
