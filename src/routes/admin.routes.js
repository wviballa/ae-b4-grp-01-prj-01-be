import { Router } from 'express';
import { adminController } from '../controllers/admin.controller.js';
import { verifyJwt } from '../middleware/verifyJwt.js';
import { roleCheck } from '../middleware/roleCheck.js';
import { requireFields } from '../middleware/validateReq.js';

const router = Router();

// Protect all admin routes with JWT and ADMIN role check
router.use(verifyJwt, roleCheck(['ADMIN']));

// 1. Dashboard BI
router.get('/reports/overview', adminController.getOverview);

// 2. Catalog Products
router.get('/products', adminController.listProducts);
router.post(
  '/products',
  requireFields(['name', 'sku', 'price']),
  adminController.createProduct
);
router.put('/products/:productId', adminController.updateProduct);
router.delete('/products/:productId', adminController.archiveProduct);

// Product Images
router.post(
  '/products/:productId/images',
  requireFields(['imageUrl']),
  adminController.addProductImage
);
router.delete('/products/:productId/images/:imageId', adminController.removeProductImage);

// 3. Inventory
router.get('/inventory', adminController.listInventory);
router.patch('/inventory/:productId', adminController.updateInventory);

// 4. Categories
router.post(
  '/categories',
  requireFields(['name']),
  adminController.createCategory
);
router.put('/categories/:categoryId', adminController.updateCategory);
router.delete('/categories/:categoryId', adminController.deleteCategory);

// 5. Orders & Fulfillment
router.get('/orders', adminController.listOrders);
router.get('/orders/:orderId', adminController.getOrder);
router.put('/orders/:orderId/status', requireFields(['status']), adminController.updateOrderStatus);
router.patch('/orders/:orderId/status', requireFields(['status']), adminController.updateOrderStatus);
router.post('/orders/:orderId/fulfill', adminController.fulfillOrder);
router.post('/orders/:orderId/cancel', adminController.cancelOrder);

// 6. Reviews Moderation
router.get('/reviews', adminController.listReviews);
router.patch(
  '/reviews/:reviewId/status',
  requireFields(['status']),
  adminController.updateReviewStatus
);

export default router;
