import { supabaseAdmin } from '../config/supabase.js';

export const paymentRepository = {
  async create({
    orderId,
    paymentGateway = 'STRIPE',
    transactionReference,
    amount,
    currency = 'USD',
    paymentMethod = 'CARD',
    status = 'INITIATED',
    rawGatewayResponse = null,
  }) {
    const { data, error } = await supabaseAdmin
      .from('payments')
      .insert({
        orderId,
        paymentGateway,
        transactionReference,
        amount,
        currency,
        paymentMethod,
        status,
        rawGatewayResponse,
      })
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },

  async findByTransactionReference(reference) {
    const { data, error } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('transactionReference', reference)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async findByOrderId(orderId) {
    const { data, error } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('orderId', orderId)
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async updateStatus(paymentId, { status, paidAt = null, rawGatewayResponse = null }) {
    const payload = { status };
    if (paidAt) payload.paidAt = paidAt;
    if (rawGatewayResponse) payload.rawGatewayResponse = rawGatewayResponse;

    const { data, error } = await supabaseAdmin
      .from('payments')
      .update(payload)
      .eq('paymentId', paymentId)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },
};
