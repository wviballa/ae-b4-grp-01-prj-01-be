import { shipmentService } from '../services/shipment.service.js';
import { successResponse } from '../utils/apiResponse.js';

export const shipmentController = {
  async trackShipment(req, res, next) {
    try {
      const shipment = await shipmentService.trackShipment(req.params.trackingNumber);
      return successResponse(res, shipment);
    } catch (err) {
      next(err);
    }
  },

  async getOrderShipment(req, res, next) {
    try {
      const shipment = await shipmentService.getOrderShipment(req.params.orderId, req.user.userId);
      return successResponse(res, shipment);
    } catch (err) {
      next(err);
    }
  },
};
