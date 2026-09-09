import { cartRepository } from '../repositories/cart.repository.js';
import { productRepository } from '../repositories/product.repository.js';
import { ApiError } from '../utils/apiError.js';

export const cartService = {
  async getCartDetails({ userId = null, sessionToken = null }) {
    const cart = await cartRepository.getOrCreateCart({ userId, sessionToken });
    const items = await cartRepository.getCartItems(cart.cartId);

    let subtotal = 0;
    const formattedItems = items.map((item) => {
      const product = item.product;
      const unitPrice = product ? Number(product.price) : 0;
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;

      const availableStock = product?.inventory
        ? product.inventory.stockQuantity - product.inventory.reservedQuantity
        : 0;

      return {
        cartItemId: item.cartItemId,
        quantity: item.quantity,
        unitPrice,
        subtotal: Number(lineTotal.toFixed(2)),
        product: product
          ? {
              productId: product.productId,
              name: product.name,
              slug: product.slug,
              sku: product.sku,
              price: product.price,
              compareAtPrice: product.compareAtPrice,
              status: product.status,
              thumbnail: product.images?.find((img) => img.isThumbnail)?.imageUrl || product.images?.[0]?.imageUrl || null,
              availableStock,
              isAvailable: availableStock >= item.quantity && product.status === 'ACTIVE',
            }
          : null,
      };
    });

    return {
      cartId: cart.cartId,
      itemCount: formattedItems.reduce((acc, curr) => acc + curr.quantity, 0),
      subtotal: Number(subtotal.toFixed(2)),
      items: formattedItems,
    };
  },

  async addItem({ userId = null, sessionToken = null, productId, quantity = 1 }) {
    if (quantity <= 0) {
      throw ApiError.badRequest('Quantity must be greater than 0');
    }

    const product = await productRepository.findByIdOrSlug(productId);
    if (!product || product.status !== 'ACTIVE') {
      throw ApiError.notFound('Product is not available for purchase');
    }

    const availableStock = product.inventory
      ? product.inventory.stockQuantity - product.inventory.reservedQuantity
      : 0;

    const cart = await cartRepository.getOrCreateCart({ userId, sessionToken });
    const existingItem = await cartRepository.findCartItem(cart.cartId, product.productId);
    const requestedTotal = (existingItem ? existingItem.quantity : 0) + quantity;

    if (availableStock < requestedTotal) {
      throw ApiError.badRequest(
        `Insufficient stock for '${product.name}'. Available: ${availableStock}, in cart: ${requestedTotal}`
      );
    }

    await cartRepository.addItem(cart.cartId, product.productId, quantity);
    return this.getCartDetails({ userId, sessionToken });
  },

  async updateItemQuantity({ userId = null, sessionToken = null, cartItemId, quantity }) {
    if (quantity <= 0) {
      return this.removeItem({ userId, sessionToken, cartItemId });
    }

    await cartRepository.updateItemQuantity(cartItemId, quantity);
    return this.getCartDetails({ userId, sessionToken });
  },

  async removeItem({ userId = null, sessionToken = null, cartItemId }) {
    await cartRepository.removeItem(cartItemId);
    return this.getCartDetails({ userId, sessionToken });
  },

  async clearCart({ userId = null, sessionToken = null }) {
    const cart = await cartRepository.getOrCreateCart({ userId, sessionToken });
    await cartRepository.clearCart(cart.cartId);
    return this.getCartDetails({ userId, sessionToken });
  },

  async mergeSessionCart({ sessionToken, userId }) {
    if (!sessionToken || !userId) return;

    const guestCart = await cartRepository.getOrCreateCart({ sessionToken });
    const userCart = await cartRepository.getOrCreateCart({ userId });

    await cartRepository.mergeSessionCartIntoUserCart(guestCart.cartId, userCart.cartId);
    return this.getCartDetails({ userId });
  },
};
