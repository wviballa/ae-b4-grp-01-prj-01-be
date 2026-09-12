import { productRepository } from '../repositories/product.repository.js';
import { inventoryRepository } from '../repositories/inventory.repository.js';
import { ApiError } from '../utils/apiError.js';

export const productService = {
  async getProducts(queryParams) {
    return productRepository.findAll(queryParams);
  },

  async getProductByIdOrSlug(idOrSlug) {
    const product = await productRepository.findByIdOrSlug(idOrSlug);
    if (!product) {
      throw ApiError.notFound(`Toy product '${idOrSlug}' not found`);
    }
    return product;
  },

  async createProduct(productData) {
    if (!productData.slug && productData.name) {
      productData.slug =
        productData.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '') +
        '-' +
        Date.now().toString().slice(-4);
    }

    const existing = await productRepository.findByIdOrSlug(productData.slug);
    if (existing) {
      throw ApiError.conflict(`A product with slug '${productData.slug}' already exists`);
    }

    const stockQty =
      productData.quantity !== undefined
        ? Number(productData.quantity)
        : productData.stockQuantity !== undefined
        ? Number(productData.stockQuantity)
        : productData.stock !== undefined
        ? Number(productData.stock)
        : productData.initialStock !== undefined
        ? Number(productData.initialStock)
        : 0;

    const newProduct = await productRepository.create({
      ...productData,
      quantity: stockQty,
    });

    // Initialize inventory for this product
    await inventoryRepository.createOrInit(newProduct.productId, {
      stockQuantity: stockQty,
      lowStockThreshold: productData.lowStockThreshold || 5,
    });

    return productRepository.findByIdOrSlug(newProduct.productId);
  },

  async updateProduct(productId, updateData) {
    const existing = await productRepository.findByIdOrSlug(productId);
    if (!existing) {
      throw ApiError.notFound('Product not found');
    }

    const newStockQty =
      updateData.quantity !== undefined
        ? Number(updateData.quantity)
        : updateData.stockQuantity !== undefined
        ? Number(updateData.stockQuantity)
        : undefined;

    if (newStockQty !== undefined) {
      updateData.quantity = newStockQty;
      await inventoryRepository.updateStock(productId, { stockQuantity: newStockQty });
    }

    const updated = await productRepository.update(productId, updateData);
    return productRepository.findByIdOrSlug(productId);
  },

  async archiveProduct(productId) {
    const existing = await productRepository.findByIdOrSlug(productId);
    if (!existing) {
      throw ApiError.notFound('Product not found');
    }

    return productRepository.archive(productId);
  },

  async addImage(imageData) {
    return productRepository.addImage(imageData);
  },

  async removeImage(imageId) {
    return productRepository.removeImage(imageId);
  },
};
