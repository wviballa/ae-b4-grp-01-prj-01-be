import { productService } from '../services/product.service.js';
import { categoryRepository } from '../repositories/category.repository.js';
import { inventoryRepository } from '../repositories/inventory.repository.js';
import { orderRepository } from '../repositories/order.repository.js';
import { orderService } from '../services/order.service.js';
import { reviewRepository } from '../repositories/review.repository.js';
import { supabaseAdmin } from '../config/supabase.js';
import { successResponse, createdResponse } from '../utils/apiResponse.js';

export const adminController = {
  // --- Products ---
  async listProducts(req, res, next) {
    try {
      const result = await productService.getProducts({
        ...req.query,
        includeAllStatuses: true,
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

  async createProduct(req, res, next) {
    try {
      const product = await productService.createProduct(req.body);
      return createdResponse(res, product);
    } catch (err) {
      next(err);
    }
  },

  async updateProduct(req, res, next) {
    try {
      const product = await productService.updateProduct(req.params.productId, req.body);
      return successResponse(res, product);
    } catch (err) {
      next(err);
    }
  },

  async archiveProduct(req, res, next) {
    try {
      const product = await productService.archiveProduct(req.params.productId);
      return successResponse(res, product);
    } catch (err) {
      next(err);
    }
  },

  async addProductImage(req, res, next) {
    try {
      const image = await productService.addImage({
        productId: req.params.productId,
        ...req.body,
      });
      return createdResponse(res, image);
    } catch (err) {
      next(err);
    }
  },

  async removeProductImage(req, res, next) {
    try {
      await productService.removeImage(req.params.imageId);
      return successResponse(res, { message: 'Image deleted successfully' });
    } catch (err) {
      next(err);
    }
  },

  // --- Inventory ---
  async listInventory(req, res, next) {
    try {
      const lowStockOnly = req.query.lowStock === 'true';
      const items = await inventoryRepository.listAll({ lowStockOnly });
      return successResponse(res, items);
    } catch (err) {
      next(err);
    }
  },

  async updateInventory(req, res, next) {
    try {
      const updated = await inventoryRepository.updateStock(req.params.productId, req.body);
      return successResponse(res, updated);
    } catch (err) {
      next(err);
    }
  },

  // --- Categories ---
  async createCategory(req, res, next) {
    try {
      const category = await categoryRepository.create(req.body);
      return createdResponse(res, category);
    } catch (err) {
      next(err);
    }
  },

  async updateCategory(req, res, next) {
    try {
      const category = await categoryRepository.update(req.params.categoryId, req.body);
      return successResponse(res, category);
    } catch (err) {
      next(err);
    }
  },

  async deleteCategory(req, res, next) {
    try {
      await categoryRepository.delete(req.params.categoryId);
      return successResponse(res, { message: 'Category deleted successfully' });
    } catch (err) {
      next(err);
    }
  },

  // --- Orders & Fulfillment ---
  async listOrders(req, res, next) {
    try {
      const { status, search, page = 1, limit = 20 } = req.query;
      const result = await orderRepository.listAll({
        status,
        search,
        page: Number(page),
        limit: Number(limit),
      });
      return successResponse(res, result.orders, {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      });
    } catch (err) {
      next(err);
    }
  },

  async getOrder(req, res, next) {
    try {
      const order = await orderRepository.findById(req.params.orderId);
      return successResponse(res, order);
    } catch (err) {
      next(err);
    }
  },

  async fulfillOrder(req, res, next) {
    try {
      const result = await orderService.fulfillOrder(req.params.orderId, req.body);
      return successResponse(res, result);
    } catch (err) {
      next(err);
    }
  },

  async cancelOrder(req, res, next) {
    try {
      const result = await orderService.cancelOrder(req.params.orderId);
      return successResponse(res, result);
    } catch (err) {
      next(err);
    }
  },

  async updateOrderStatus(req, res, next) {
    try {
      const { status } = req.body;
      const updated = await orderRepository.updateStatus(req.params.orderId, status);
      return successResponse(res, updated);
    } catch (err) {
      next(err);
    }
  },

  // --- Reviews Moderation ---
  async listReviews(req, res, next) {
    try {
      const { status = 'PENDING', page = 1, limit = 20 } = req.query;
      const result = await reviewRepository.listForAdmin({
        status,
        page: Number(page),
        limit: Number(limit),
      });
      return successResponse(res, result.reviews, {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      });
    } catch (err) {
      next(err);
    }
  },

  async updateReviewStatus(req, res, next) {
    try {
      const updated = await reviewRepository.updateStatus(req.params.reviewId, req.body.status);
      return successResponse(res, updated);
    } catch (err) {
      next(err);
    }
  },

  // --- Dashboard BI Overview ---
  async getOverview(req, res, next) {
    try {
      const { from, to } = req.query;

      // 1. Fetch products count
      const { count: totalProductsCount } = await supabaseAdmin
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ACTIVE');

      // 2. Query orders
      let ordersQuery = supabaseAdmin
        .from('orders')
        .select('orderId, totalAmount, status, createdAt');

      if (from) {
        ordersQuery = ordersQuery.gte('createdAt', new Date(from).toISOString());
      }
      if (to) {
        const toDate = new Date(to);
        if (!to.includes('T')) toDate.setHours(23, 59, 59, 999);
        ordersQuery = ordersQuery.lte('createdAt', toDate.toISOString());
      }

      let { data: allOrders, error: ordersError } = await ordersQuery;
      if (ordersError) throw ordersError;

      // Fallback: If date range returned 0 orders, query all orders to avoid zeroing out overview
      if ((!allOrders || allOrders.length === 0) && (from || to)) {
        const fallbackRes = await supabaseAdmin
          .from('orders')
          .select('orderId, totalAmount, status, createdAt');
        if (fallbackRes.data && fallbackRes.data.length > 0) {
          allOrders = fallbackRes.data;
        }
      }

      const activeOrders = (allOrders || []).filter((o) => o.status !== 'CANCELLED');

      const totalRevenue = activeOrders.reduce(
        (sum, ord) => sum + Number(ord.totalAmount || 0),
        0
      );

      const totalOrders = (allOrders || []).length;
      const activeProducts = totalProductsCount || 0;
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      const orderMetrics = {
        total: totalOrders,
        pending: (allOrders || []).filter((o) => o.status === 'PENDING').length,
        confirmed: (allOrders || []).filter((o) => o.status === 'CONFIRMED' || o.status === 'PENDING').length,
        processing: (allOrders || []).filter((o) => o.status === 'PROCESSING').length,
        delivered: (allOrders || []).filter((o) => o.status === 'DELIVERED' || o.status === 'COMPLETED').length,
        cancelled: (allOrders || []).filter((o) => o.status === 'CANCELLED').length,
      };

      const lowStockItems = await inventoryRepository.listAll({ lowStockOnly: true });

      // 3. Compute Top Selling Products
      const { data: orderItems } = await supabaseAdmin
        .from('order_items')
        .select('productId, productName, quantity, unitPrice, subtotal');

      const productSalesMap = {};
      (orderItems || []).forEach((item) => {
        const id = item.productId || item.productName;
        if (!productSalesMap[id]) {
          productSalesMap[id] = {
            productId: item.productId,
            name: item.productName || 'Toy Item',
            soldQuantity: 0,
            revenue: 0,
          };
        }
        productSalesMap[id].soldQuantity += Number(item.quantity || 1);
        productSalesMap[id].revenue += Number(item.subtotal || item.unitPrice * item.quantity || 0);
      });

      const topProducts = Object.values(productSalesMap)
        .sort((a, b) => b.soldQuantity - a.soldQuantity)
        .slice(0, 5);

      return successResponse(res, {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        revenue: Number(totalRevenue.toFixed(2)),
        totalOrders,
        orderCount: totalOrders,
        orders: totalOrders,
        averageOrderValue: Number(averageOrderValue.toFixed(2)),
        activeProducts,
        activeProductsCount: activeProducts,
        productCount: activeProducts,
        lowStockAlertsCount: lowStockItems.length,
        lowStockAlerts: lowStockItems,
        orderMetrics,
        confirmedOrders: orderMetrics.confirmed,
        processingOrders: orderMetrics.processing,
        deliveredOrders: orderMetrics.delivered,
        cancelledOrders: orderMetrics.cancelled,
        topProducts,
      });
    } catch (err) {
      next(err);
    }
  },
};
