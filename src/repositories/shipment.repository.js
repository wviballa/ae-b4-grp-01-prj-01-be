import { supabaseAdmin } from '../config/supabase.js';

export const shipmentRepository = {
  async create({
    orderId,
    trackingNumber,
    carrier = 'FEDEX',
    status = 'PENDING',
    shippedAt = null,
    estimatedDeliveryAt = null,
  }) {
    const { data, error } = await supabaseAdmin
      .from('shipments')
      .insert({
        orderId,
        trackingNumber,
        carrier,
        status,
        shippedAt,
        estimatedDeliveryAt,
      })
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },

  async findByTrackingNumber(trackingNumber) {
    const { data, error } = await supabaseAdmin
      .from('shipments')
      .select(`
        *,
        order:orders(orderId, orderNumber, status, createdAt)
      `)
      .eq('trackingNumber', trackingNumber)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async findByOrderId(orderId) {
    const { data, error } = await supabaseAdmin
      .from('shipments')
      .select('*')
      .eq('orderId', orderId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async updateStatus(shipmentId, { status, deliveredAt = null }) {
    const payload = { status };
    if (deliveredAt) payload.deliveredAt = deliveredAt;

    const { data, error } = await supabaseAdmin
      .from('shipments')
      .update(payload)
      .eq('shipmentId', shipmentId)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },
};
