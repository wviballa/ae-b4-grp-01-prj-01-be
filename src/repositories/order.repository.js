import { supabaseAdmin } from '../config/supabase.js';

export const orderRepository = {
  async createOrder({
    userId,
    addressId,
    orderNumber,
    subtotalAmount,
    shippingFee = 0,
    taxAmount = 0,
    discountAmount = 0,
    totalAmount,
    currency = 'USD',
    orderNotes = null,
    items = [],
  }) {
    // 1. Insert order
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        userId,
        addressId,
        orderNumber,
        subtotalAmount,
        shippingFee,
        taxAmount,
        discountAmount,
        totalAmount,
        currency,
        status: 'PENDING',
        orderNotes,
      })
      .select('*')
      .single();

    if (orderError) throw orderError;

    // 2. Insert order items
    if (items.length > 0) {
      const orderItemsToInsert = items.map((item) => ({
        orderId: order.orderId,
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: item.subtotal,
      }));

      const { error: itemsError } = await supabaseAdmin
        .from('order_items')
        .insert(orderItemsToInsert);

      if (itemsError) throw itemsError;
    }

    return order;
  },

  async findById(orderId, userId = null) {
    let query = supabaseAdmin
      .from('orders')
      .select(`
        *,
        address:addresses(*),
        items:order_items(*),
        payments(*),
        shipments(*)
      `)
      .eq('orderId', orderId);

    if (userId) {
      query = query.eq('userId', userId);
    }

    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return data;
  },

  async findByUserId(userId, { page = 1, limit = 10 } = {}) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await supabaseAdmin
      .from('orders')
      .select(
        `
        *,
        items:order_items(orderItemId, productName, sku, quantity, unitPrice, subtotal),
        shipments(shipmentId, trackingNumber, carrier, status)
      `,
        { count: 'exact' }
      )
      .eq('userId', userId)
      .order('createdAt', { ascending: false })
      .range(from, to);

    if (error) throw error;

    return {
      orders: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  },

  async updateStatus(orderId, status) {
    const { data, error } = await supabaseAdmin
      .from('orders')
      .update({ status })
      .eq('orderId', orderId)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },

  async listAll({ status, search, page = 1, limit = 20 } = {}) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabaseAdmin
      .from('orders')
      .select(
        `
        *,
        user:users(userId, email),
        address:addresses(recipientName, city, stateProvince),
        items:order_items(orderItemId, productName, quantity, unitPrice),
        shipments(shipmentId, trackingNumber, carrier, status)
      `,
        { count: 'exact' }
      );

    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.ilike('orderNumber', `%${search}%`);
    }

    query = query.order('createdAt', { ascending: false }).range(from, to);

    const { data, count, error } = await query;
    if (error) throw error;

    return {
      orders: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  },
};
