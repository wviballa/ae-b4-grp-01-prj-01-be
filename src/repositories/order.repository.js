import { supabaseAdmin } from '../config/supabase.js';

function normalizeOrder(order) {
  if (!order) return null;

  const items = Array.isArray(order.items)
    ? order.items.map((it) => ({
        ...it,
        name: it.productName || it.name,
        price: it.unitPrice !== undefined ? Number(it.unitPrice) : Number(it.price || 0),
        subtotal:
          it.subtotal !== undefined
            ? Number(it.subtotal)
            : Number(it.unitPrice || 0) * (it.quantity || 1),
      }))
    : [];

  const payment =
    Array.isArray(order.payments) && order.payments.length > 0
      ? order.payments[0]
      : order.payment || null;

  const shipment =
    Array.isArray(order.shipments) && order.shipments.length > 0
      ? order.shipments[0]
      : order.shipment || null;

  const address = order.address || order.shippingAddress || null;
  const customerName =
    address?.recipientName || order.user?.email?.split('@')[0] || 'Customer';
  const customerEmail = order.user?.email || '';

  return {
    ...order,
    id: order.orderId,
    total: Number(order.totalAmount || order.total || 0),
    subtotal: Number(order.subtotalAmount || order.subtotal || 0),
    tax: Number(order.taxAmount || order.tax || 0),
    shippingFee: Number(order.shippingFee || 0),
    discount: Number(order.discountAmount || order.discount || 0),
    customerName,
    customerEmail,
    user: {
      ...(order.user || {}),
      name: customerName,
      email: customerEmail,
    },
    shippingAddress: address,
    payment,
    shipment,
    items,
    itemCount: items.reduce((sum, it) => sum + Number(it.quantity || 1), 0),
  };
}

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

    return this.findById(order.orderId);
  },

  async findById(orderId, userId = null) {
    let query = supabaseAdmin
      .from('orders')
      .select(`
        *,
        user:users(userId, email),
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
    return normalizeOrder(data);
  },

  async findByUserId(userId, { page = 1, limit = 10 } = {}) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, count, error } = await supabaseAdmin
      .from('orders')
      .select(
        `
        *,
        user:users(userId, email),
        address:addresses(*),
        items:order_items(*),
        payments(*),
        shipments(*)
      `,
        { count: 'exact' }
      )
      .eq('userId', userId)
      .order('createdAt', { ascending: false })
      .range(from, to);

    if (error) throw error;

    return {
      orders: (data || []).map(normalizeOrder),
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
    return this.findById(data.orderId);
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
        address:addresses(*),
        items:order_items(*),
        payments(*),
        shipments(*)
      `,
        { count: 'exact' }
      );

    if (status && status !== 'ALL') {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.ilike('orderNumber', `%${search}%`);
    }

    query = query.order('createdAt', { ascending: false }).range(from, to);

    const { data, count, error } = await query;
    if (error) throw error;

    return {
      orders: (data || []).map(normalizeOrder),
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  },
};
