import { orderRepository } from '../repositories/order.repository.js';
import { cartRepository } from '../repositories/cart.repository.js';
import { addressRepository } from '../repositories/address.repository.js';
import { inventoryRepository } from '../repositories/inventory.repository.js';
import { shipmentRepository } from '../repositories/shipment.repository.js';
import { ApiError } from '../utils/apiError.js';

export const orderService = {
  generateOrderNumber() {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(1000 + Math.random() * 9000);
    return `ORD-${timestamp}-${random}`;
  },

  calculateTotals(items) {
    const subtotal = items.reduce((sum, item) => {
      const price = Number(item.product?.price || item.unitPrice || 0);
      return sum + price * item.quantity;
    }, 0);

    const shippingFee = subtotal >= 50 || subtotal === 0 ? 0 : 7.99;
    const taxAmount = Number((subtotal * 0.08).toFixed(2));
    const discountAmount = 0;
    const totalAmount = Number((subtotal + shippingFee + taxAmount - discountAmount).toFixed(2));

    return {
      subtotal: Number(subtotal.toFixed(2)),
      shippingFee,
      taxAmount,
      discountAmount,
      totalAmount,
    };
  },

  async getCheckoutSummary({ userId, addressId }) {
    const address = await addressRepository.findById(addressId, userId);
    if (!address) {
      throw ApiError.badRequest('Valid shipping address is required for checkout');
    }

    const userCart = await cartRepository.getOrCreateCart({ userId });
    const cartItems = await cartRepository.getCartItems(userCart.cartId);

    if (!cartItems.length) {
      throw ApiError.badRequest('Cannot checkout with an empty cart');
    }

    for (const item of cartItems) {
      const p = item.product;
      if (!p || p.status !== 'ACTIVE') {
        throw ApiError.badRequest(`Product '${p?.name || 'Unknown'}' is no longer available`);
      }
      const available = p.inventory
        ? p.inventory.stockQuantity - p.inventory.reservedQuantity
        : 0;
      if (available < item.quantity) {
        throw ApiError.badRequest(
          `Insufficient stock for '${p.name}'. Requested: ${item.quantity}, Available: ${available}`
        );
      }
    }

    const totals = this.calculateTotals(cartItems);

    return {
      shippingAddress: address,
      itemCount: cartItems.length,
      ...totals,
    };
  },

  async createOrderFromCart({ userId, addressId, orderNotes = null }) {
    const address = await addressRepository.findById(addressId, userId);
    if (!address) {
      throw ApiError.badRequest('Valid shipping address is required to place an order');
    }

    const userCart = await cartRepository.getOrCreateCart({ userId });
    const cartItems = await cartRepository.getCartItems(userCart.cartId);

    if (!cartItems.length) {
      throw ApiError.badRequest('Your shopping cart is empty');
    }

    const reservedItems = [];
    for (const item of cartItems) {
      const p = item.product;
      const res = await inventoryRepository.reserveStock(p.productId, item.quantity);
      if (!res.success) {
        for (const rev of reservedItems) {
          await inventoryRepository.releaseReservation(rev.productId, rev.quantity);
        }
        throw ApiError.badRequest(
          `Insufficient stock for '${p.name}'. Only ${res.available} left.`
        );
      }
      reservedItems.push({ productId: p.productId, quantity: item.quantity });
    }

    const totals = this.calculateTotals(cartItems);
    const orderNumber = this.generateOrderNumber();

    const orderPayloadItems = cartItems.map((item) => ({
      productId: item.product.productId,
      productName: item.product.name,
      sku: item.product.sku,
      quantity: item.quantity,
      unitPrice: Number(item.product.price),
      subtotal: Number((Number(item.product.price) * item.quantity).toFixed(2)),
    }));

    try {
      const order = await orderRepository.createOrder({
        userId,
        addressId,
        orderNumber,
        subtotalAmount: totals.subtotal,
        shippingFee: totals.shippingFee,
        taxAmount: totals.taxAmount,
        discountAmount: totals.discountAmount,
        totalAmount: totals.totalAmount,
        orderNotes,
        items: orderPayloadItems,
      });

      await cartRepository.clearCart(userCart.cartId);
      return order;
    } catch (err) {
      for (const rev of reservedItems) {
        await inventoryRepository.releaseReservation(rev.productId, rev.quantity);
      }
      throw err;
    }
  },

  async getOrderById(orderId, userId = null) {
    const order = await orderRepository.findById(orderId, userId);
    if (!order) {
      throw ApiError.notFound('Order not found');
    }
    return order;
  },

  async getUserOrders(userId, query) {
    return orderRepository.findByUserId(userId, query);
  },

  async fulfillOrder(orderId, { carrier = 'FEDEX', trackingNumber }) {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    const finalTrackingNumber = trackingNumber || `TRK-${Date.now().toString().slice(-8)}`;

    const shipment = await shipmentRepository.create({
      orderId,
      trackingNumber: finalTrackingNumber,
      carrier,
      status: 'DISPATCHED',
      shippedAt: new Date().toISOString(),
    });

    await orderRepository.updateStatus(orderId, 'SHIPPED');

    return {
      orderId,
      status: 'SHIPPED',
      shipment,
    };
  },

  async cancelOrder(orderId) {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw ApiError.notFound('Order not found');
    }

    if (['SHIPPED', 'DELIVERED'].includes(order.status)) {
      throw ApiError.badRequest('Cannot cancel an order that has already shipped or delivered');
    }

    if (order.items && order.items.length > 0) {
      for (const item of order.items) {
        if (item.productId) {
          await inventoryRepository.releaseReservation(item.productId, item.quantity);
        }
      }
    }

    const updated = await orderRepository.updateStatus(orderId, 'CANCELLED');
    return updated;
  },
};
