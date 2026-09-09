import { Router } from 'express';
import { cartController } from '../controllers/cart.controller.js';
import { optionalJwt, verifyJwt } from '../middleware/verifyJwt.js';
import { requireFields } from '../middleware/validateReq.js';

const router = Router();

router.get('/', optionalJwt, cartController.getCart);
router.post('/items', optionalJwt, requireFields(['productId']), cartController.addItem);
router.put('/items/:cartItemId', optionalJwt, requireFields(['quantity']), cartController.updateItem);
router.delete('/items/:cartItemId', optionalJwt, cartController.removeItem);
router.delete('/', optionalJwt, cartController.clearCart);

// Merge guest cart on customer login
router.post('/merge', verifyJwt, requireFields(['sessionToken']), cartController.mergeCart);

export default router;
