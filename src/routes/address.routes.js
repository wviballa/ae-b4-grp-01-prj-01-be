import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { verifyJwt } from '../middleware/verifyJwt.js';
import { requireFields } from '../middleware/validateReq.js';

const router = Router();

router.use(verifyJwt);

router.get('/', authController.getAddresses);
router.post(
  '/',
  requireFields(['recipientName', 'addressLine1', 'city', 'stateProvince', 'postalCode']),
  authController.createAddress
);
router.put('/:addressId', authController.updateAddress);
router.patch('/:addressId/default', authController.setDefaultAddress);
router.delete('/:addressId', authController.deleteAddress);

export default router;
