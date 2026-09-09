import { Router } from 'express';
import { productController } from '../controllers/product.controller.js';
import { verifyJwt } from '../middleware/verifyJwt.js';
import { requireFields } from '../middleware/validateReq.js';

const router = Router();

router.get('/', productController.listProducts);
router.get('/:productIdOrSlug', productController.getProduct);
router.get('/:productId/reviews', productController.getProductReviews);

router.post(
  '/:productId/reviews',
  verifyJwt,
  requireFields(['rating', 'title']),
  productController.addProductReview
);

export default router;
