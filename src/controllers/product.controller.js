import { productService } from '../services/product.service.js';
import { reviewRepository } from '../repositories/review.repository.js';
import { successResponse, createdResponse } from '../utils/apiResponse.js';

export const productController = {
  async listProducts(req, res, next) {
    try {
      const {
        categoryId,
        ageMin,
        ageMax,
        minPrice,
        maxPrice,
        brand,
        search,
        page = 1,
        limit = 20,
        sort = 'newest',
      } = req.query;

      const result = await productService.getProducts({
        categoryId,
        ageMin,
        ageMax,
        minPrice,
        maxPrice,
        brand,
        search,
        page: Number(page),
        limit: Number(limit),
        sort,
      });

      return successResponse(res, result.products, {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      });
    } catch (err) {
      next(err);
    }
  },

  async getProduct(req, res, next) {
    try {
      const product = await productService.getProductByIdOrSlug(req.params.productIdOrSlug);
      return successResponse(res, product);
    } catch (err) {
      next(err);
    }
  },

  async getProductReviews(req, res, next) {
    try {
      const reviews = await reviewRepository.findByProductId(req.params.productId);
      return successResponse(res, reviews);
    } catch (err) {
      next(err);
    }
  },

  async addProductReview(req, res, next) {
    try {
      const { rating, title, comment } = req.body;
      const review = await reviewRepository.create({
        userId: req.user.userId,
        productId: req.params.productId,
        rating: Number(rating),
        title,
        comment,
      });
      return createdResponse(res, review);
    } catch (err) {
      next(err);
    }
  },
};
