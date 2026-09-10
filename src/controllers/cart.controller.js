import { cartService } from '../services/cart.service.js';
import { successResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';

export const cartController = {
  _getIdentifiers(req) {
    const userId = req.user?.userId || null;
    let sessionToken =
      req.headers['x-session-token'] ||
      req.headers['x-cart-session'] ||
      req.headers['x-guest-token'] ||
      req.query?.sessionToken ||
      req.body?.sessionToken ||
      req.cookies?.cart_session ||
      null;

    if (!userId && !sessionToken) {
      sessionToken = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    }

    return { userId, sessionToken };
  },

  async getCart(req, res, next) {
    try {
      const { userId, sessionToken } = cartController._getIdentifiers(req);
      const cart = await cartService.getCartDetails({ userId, sessionToken });
      return successResponse(res, cart);
    } catch (err) {
      next(err);
    }
  },

  async addItem(req, res, next) {
    try {
      const { userId, sessionToken } = cartController._getIdentifiers(req);
      const { productId, quantity = 1 } = req.body;
      const cart = await cartService.addItem({
        userId,
        sessionToken,
        productId,
        quantity: Number(quantity),
      });
      return successResponse(res, cart);
    } catch (err) {
      next(err);
    }
  },

  async updateItem(req, res, next) {
    try {
      const { userId, sessionToken } = cartController._getIdentifiers(req);
      const { quantity } = req.body;
      const cart = await cartService.updateItemQuantity({
        userId,
        sessionToken,
        cartItemId: req.params.cartItemId,
        quantity: Number(quantity),
      });
      return successResponse(res, cart);
    } catch (err) {
      next(err);
    }
  },

  async removeItem(req, res, next) {
    try {
      const { userId, sessionToken } = cartController._getIdentifiers(req);
      const cart = await cartService.removeItem({
        userId,
        sessionToken,
        cartItemId: req.params.cartItemId,
      });
      return successResponse(res, cart);
    } catch (err) {
      next(err);
    }
  },

  async clearCart(req, res, next) {
    try {
      const { userId, sessionToken } = cartController._getIdentifiers(req);
      const cart = await cartService.clearCart({ userId, sessionToken });
      return successResponse(res, cart);
    } catch (err) {
      next(err);
    }
  },

  async mergeCart(req, res, next) {
    try {
      const { sessionToken } = req.body;
      const userId = req.user.userId;
      const cart = await cartService.mergeSessionCart({ sessionToken, userId });
      return successResponse(res, cart);
    } catch (err) {
      next(err);
    }
  },
};
