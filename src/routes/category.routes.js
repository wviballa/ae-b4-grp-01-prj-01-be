import { Router } from 'express';
import { categoryController } from '../controllers/category.controller.js';

const router = Router();

router.get('/', categoryController.listCategories);
router.get('/:slug', categoryController.getCategoryBySlug);

export default router;
