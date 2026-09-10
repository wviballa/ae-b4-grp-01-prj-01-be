import { paymentService } from '../services/payment.service.js';
import { successResponse, createdResponse } from '../utils/apiResponse.js';

export const paymentController = {
  async createIntent(req, res, next) {
    try {
      const { orderId, paymentGateway = 'STRIPE', paymentMethod = 'CARD' } = req.body;
      const result = await paymentService.createPaymentIntent({
        orderId,
        userId: req.user.userId,
        paymentGateway,
        paymentMethod,
      });
      return createdResponse(res, result);
    } catch (err) {
      next(err);
    }
  },

  async webhook(req, res, next) {
    try {
      const { transactionReference, status, data } = req.body;
      const result = await paymentService.handlePaymentWebhook({
        transactionReference,
        status,
        rawData: data || req.body,
      });
      return successResponse(res, result);
    } catch (err) {
      next(err);
    }
  },

  async getPaymentByOrderId(req, res, next) {
    try {
      const payments = await paymentService.getPaymentByOrderId(req.params.orderId, req.user.userId);
      return successResponse(res, payments);
    } catch (err) {
      next(err);
    }
  },
};
