import { paymentRepository } from '../repositories/payment.repository.js';
import { orderRepository } from '../repositories/order.repository.js';
import { inventoryRepository } from '../repositories/inventory.repository.js';
import { ApiError } from '../utils/apiError.js';

export const paymentService = {
  async createPaymentIntent({ orderId, userId, paymentGateway = 'STRIPE', paymentMethod = 'CARD' }) {
    const order = await orderRepository.findById(orderId, userId);
    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    if (order.status !== 'PENDING') {
      throw ApiError.badRequest(`Order cannot be paid in current status: ${order.status}`);
    }

    const transactionReference = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const payment = await paymentRepository.create({
      orderId: order.orderId,
      paymentGateway,
      transactionReference,
      amount: order.totalAmount,
      currency: order.currency || 'USD',
      paymentMethod,
      status: 'INITIATED',
    });

    return {
      paymentId: payment.paymentId,
      orderId: order.orderId,
      orderNumber: order.orderNumber,
      amount: order.totalAmount,
      currency: payment.currency,
      transactionReference,
      clientSecret: `mock_sec_${transactionReference}`,
    };
  },

  async handlePaymentWebhook({ transactionReference, status, rawData = {} }) {
    const payment = await paymentRepository.findByTransactionReference(transactionReference);
    if (!payment) {
      throw ApiError.notFound(`Payment transaction reference '${transactionReference}' not found`);
    }

    const order = await orderRepository.findById(payment.orderId);
    if (!order) {
      throw ApiError.notFound('Associated order not found');
    }

    if (status === 'SUCCESS') {
      // 1. Update payment status
      await paymentRepository.updateStatus(payment.paymentId, {
        status: 'SUCCESS',
        paidAt: new Date().toISOString(),
        rawGatewayResponse: rawData,
      });

      // 2. Update order status to PROCESSING
      await orderRepository.updateStatus(order.orderId, 'PROCESSING');

      // 3. Atomically finalize stock deduction
      if (order.items && order.items.length > 0) {
        for (const item of order.items) {
          if (item.productId) {
            await inventoryRepository.finalizeDeduction(item.productId, item.quantity);
          }
        }
      }

      return { success: true, message: 'Payment confirmed, inventory deducted', orderId: order.orderId };
    } else {
      // Payment Failed or Expired
      await paymentRepository.updateStatus(payment.paymentId, {
        status: 'FAILED',
        rawGatewayResponse: rawData,
      });

      await orderRepository.updateStatus(order.orderId, 'CANCELLED');

      // Release inventory reservations
      if (order.items && order.items.length > 0) {
        for (const item of order.items) {
          if (item.productId) {
            await inventoryRepository.releaseReservation(item.productId, item.quantity);
          }
        }
      }

      return { success: false, message: 'Payment failed, inventory reservation released', orderId: order.orderId };
    }
  },
};
