import { shipmentRepository } from '../repositories/shipment.repository.js';
import { orderRepository } from '../repositories/order.repository.js';
import { ApiError } from '../utils/apiError.js';

export const shipmentService = {
  async trackShipment(trackingNumber) {
    const shipment = await shipmentRepository.findByTrackingNumber(trackingNumber);
    if (!shipment) {
      throw ApiError.notFound(`Tracking number '${trackingNumber}' not found`);
    }

    return shipment;
  },

  async getOrderShipment(orderId, userId) {
    // Verify user owns order
    const order = await orderRepository.findById(orderId, userId);
    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    const shipment = await shipmentRepository.findByOrderId(orderId);
    if (!shipment) {
      throw ApiError.notFound('No shipment record found for this order yet');
    }

    return shipment;
  },

  async updateShipmentStatus(shipmentId, { status }) {
    const payload = { status };
    if (status === 'DELIVERED') {
      payload.deliveredAt = new Date().toISOString();
    }

    const updated = await shipmentRepository.updateStatus(shipmentId, payload);
    return updated;
  },
};
