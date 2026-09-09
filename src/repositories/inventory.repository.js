import { supabaseAdmin } from '../config/supabase.js';

export const inventoryRepository = {
  async findByProductId(productId) {
    const { data, error } = await supabaseAdmin
      .from('inventories')
      .select('*')
      .eq('productId', productId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createOrInit(productId, { stockQuantity = 0, lowStockThreshold = 5, trackQuantity = true }) {
    const { data, error } = await supabaseAdmin
      .from('inventories')
      .upsert({
        productId,
        stockQuantity,
        reservedQuantity: 0,
        lowStockThreshold,
        trackQuantity,
      })
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },

  async updateStock(productId, { stockQuantity, lowStockThreshold, trackQuantity }) {
    const payload = {};
    if (stockQuantity !== undefined) payload.stockQuantity = stockQuantity;
    if (lowStockThreshold !== undefined) payload.lowStockThreshold = lowStockThreshold;
    if (trackQuantity !== undefined) payload.trackQuantity = trackQuantity;

    const { data, error } = await supabaseAdmin
      .from('inventories')
      .update(payload)
      .eq('productId', productId)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },

  async reserveStock(productId, quantity) {
    const current = await this.findByProductId(productId);
    if (!current) throw new Error('Inventory record not found');

    const available = current.stockQuantity - current.reservedQuantity;
    if (available < quantity) {
      return { success: false, available, requested: quantity };
    }

    const { data, error } = await supabaseAdmin
      .from('inventories')
      .update({
        reservedQuantity: current.reservedQuantity + quantity,
      })
      .eq('productId', productId)
      .select('*')
      .single();

    if (error) throw error;
    return { success: true, inventory: data };
  },

  async releaseReservation(productId, quantity) {
    const current = await this.findByProductId(productId);
    if (!current) return;

    const newReserved = Math.max(0, current.reservedQuantity - quantity);

    const { data, error } = await supabaseAdmin
      .from('inventories')
      .update({
        reservedQuantity: newReserved,
      })
      .eq('productId', productId)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },

  async finalizeDeduction(productId, quantity) {
    const current = await this.findByProductId(productId);
    if (!current) return;

    const newStock = Math.max(0, current.stockQuantity - quantity);
    const newReserved = Math.max(0, current.reservedQuantity - quantity);

    const { data, error } = await supabaseAdmin
      .from('inventories')
      .update({
        stockQuantity: newStock,
        reservedQuantity: newReserved,
      })
      .eq('productId', productId)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },

  async listAll({ lowStockOnly = false } = {}) {
    let query = supabaseAdmin
      .from('inventories')
      .select(`
        *,
        product:products(productId, name, sku, price, status)
      `)
      .order('stockQuantity', { ascending: true });

    const { data, error } = await query;
    if (error) throw error;

    if (lowStockOnly) {
      return (data || []).filter(
        (inv) => inv.stockQuantity <= inv.lowStockThreshold
      );
    }

    return data || [];
  },
};
