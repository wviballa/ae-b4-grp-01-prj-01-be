import { supabaseAdmin } from '../config/supabase.js';

export const cartRepository = {
  async getOrCreateCart({ userId = null, sessionToken = null }) {
    let query = supabaseAdmin.from('carts').select('*');

    if (userId) {
      query = query.eq('userId', userId);
    } else if (sessionToken) {
      query = query.eq('sessionToken', sessionToken);
    } else {
      throw new Error('Either userId or sessionToken is required to retrieve a cart');
    }

    const { data: existingCart, error: findError } = await query.maybeSingle();
    if (findError) throw findError;

    if (existingCart) {
      return existingCart;
    }

    const payload = {};
    if (userId) payload.userId = userId;
    if (sessionToken) payload.sessionToken = sessionToken;

    const { data: newCart, error: createError } = await supabaseAdmin
      .from('carts')
      .insert(payload)
      .select('*')
      .single();

    if (createError) throw createError;
    return newCart;
  },

  async getCartItems(cartId) {
    const { data, error } = await supabaseAdmin
      .from('cart_items')
      .select(`
        cartItemId,
        cartId,
        quantity,
        createdAt,
        updatedAt,
        product:products(
          productId,
          name,
          slug,
          sku,
          price,
          compareAtPrice,
          status,
          images:product_images(imageUrl, isThumbnail),
          inventory:inventories(stockQuantity, reservedQuantity)
        )
      `)
      .eq('cartId', cartId)
      .order('createdAt', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async findCartItem(cartId, productId) {
    const { data, error } = await supabaseAdmin
      .from('cart_items')
      .select('*')
      .eq('cartId', cartId)
      .eq('productId', productId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async addItem(cartId, productId, quantity) {
    const existing = await this.findCartItem(cartId, productId);

    if (existing) {
      const newQty = existing.quantity + quantity;
      const { data, error } = await supabaseAdmin
        .from('cart_items')
        .update({ quantity: newQty })
        .eq('cartItemId', existing.cartItemId)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    }

    const { data, error } = await supabaseAdmin
      .from('cart_items')
      .insert({
        cartId,
        productId,
        quantity,
      })
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },

  async updateItemQuantity(cartItemId, quantity) {
    const { data, error } = await supabaseAdmin
      .from('cart_items')
      .update({ quantity })
      .eq('cartItemId', cartItemId)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },

  async removeItem(cartItemId) {
    const { error } = await supabaseAdmin
      .from('cart_items')
      .delete()
      .eq('cartItemId', cartItemId);

    if (error) throw error;
    return true;
  },

  async clearCart(cartId) {
    const { error } = await supabaseAdmin
      .from('cart_items')
      .delete()
      .eq('cartId', cartId);

    if (error) throw error;
    return true;
  },

  async mergeSessionCartIntoUserCart(guestCartId, userCartId) {
    const guestItems = await this.getCartItems(guestCartId);

    for (const item of guestItems) {
      if (!item.product) continue;
      await this.addItem(userCartId, item.product.productId, item.quantity);
    }

    await this.clearCart(guestCartId);
  },
};
