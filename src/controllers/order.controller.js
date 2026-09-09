import { orderService } from '../services/order.service.js';
import { successResponse, createdResponse } from '../utils/apiResponse.js';

export const orderController = {
  async getCheckoutSummary(req, res, next) {
    try {
      const { addressId } = req.body;
      const summary = await orderService.getCheckoutSummary({
        userId: req.user.userId,
        addressId,
      });
      return successResponse(res, summary);
    } catch (err) {
      next(err);
    }
  },

  async createOrder(req, res, next) {
    try {
      const { addressId, orderNotes } = req.body;
      const order = await orderService.createOrderFromCart({
        userId: req.user.userId,
        addressId,
        orderNotes,
      });
      return createdResponse(res, order);
    } catch (err) {
      next(err);
    }
  },

  async listUserOrders(req, res, next) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const result = await orderService.getUserOrders(req.user.userId, {
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
      const order = await orderService.getOrderById(req.params.orderId, req.user.userId);
      return successResponse(res, order);
    } catch (err) {
      next(err);
    }
  },

  async getOrderReceipt(req, res, next) {
    try {
      const order = await orderService.getOrderById(req.params.orderId, req.user.userId);
      const receipt = {
        receiptId: `REC-${order.orderNumber}`,
        orderNumber: order.orderNumber,
        date: order.createdAt,
        customerEmail: req.user.email,
        shippingAddress: order.address,
        items: order.items,
        summary: {
          subtotal: order.subtotalAmount,
          shippingFee: order.shippingFee,
          taxAmount: order.taxAmount,
          discountAmount: order.discountAmount,
          totalAmount: order.totalAmount,
          currency: order.currency,
        },
        paymentStatus: order.payments?.[0]?.status || 'PENDING',
        shipmentStatus: order.shipments?.[0]?.status || 'UNFULFILLED',
      };
      return successResponse(res, receipt);
    } catch (err) {
      next(err);
    }
  },
};
