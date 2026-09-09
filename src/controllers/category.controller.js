import { categoryRepository } from '../repositories/category.repository.js';
import { successResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';

export const categoryController = {
  async listCategories(req, res, next) {
    try {
      const categories = await categoryRepository.findAll({ onlyActive: true });
      return successResponse(res, categories);
    } catch (err) {
      next(err);
    }
  },

  async getCategoryBySlug(req, res, next) {
    try {
      const category = await categoryRepository.findBySlug(req.params.slug);
      if (!category) {
        throw ApiError.notFound(`Category '${req.params.slug}' not found`);
      }
      return successResponse(res, category);
    } catch (err) {
      next(err);
    }
  },
};
