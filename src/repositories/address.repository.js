import { supabaseAdmin } from '../config/supabase.js';

export const addressRepository = {
  async findByUserId(userId) {
    const { data, error } = await supabaseAdmin
      .from('addresses')
      .select('*')
      .eq('userId', userId)
      .order('isDefaultShipping', { ascending: false })
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async findById(addressId, userId = null) {
    let query = supabaseAdmin
      .from('addresses')
      .select('*')
      .eq('addressId', addressId);

    if (userId) {
      query = query.eq('userId', userId);
    }

    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return data;
  },

  async create(userId, addressData) {
    const {
      recipientName,
      phone,
      addressLine1,
      addressLine2,
      city,
      stateProvince,
      postalCode,
      country = 'USA',
      isDefaultShipping = false,
    } = addressData;

    if (isDefaultShipping) {
      await supabaseAdmin
        .from('addresses')
        .update({ isDefaultShipping: false })
        .eq('userId', userId);
    }

    const { data, error } = await supabaseAdmin
      .from('addresses')
      .insert({
        userId,
        recipientName,
        phone,
        addressLine1,
        addressLine2,
        city,
        stateProvince,
        postalCode,
        country,
        isDefaultShipping,
      })
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },

  async update(addressId, userId, updateData) {
    const payload = {};
    const allowed = [
      'recipientName',
      'phone',
      'addressLine1',
      'addressLine2',
      'city',
      'stateProvince',
      'postalCode',
      'country',
    ];

    for (const key of allowed) {
      if (updateData[key] !== undefined) {
        payload[key] = updateData[key];
      }
    }

    const { data, error } = await supabaseAdmin
      .from('addresses')
      .update(payload)
      .eq('addressId', addressId)
      .eq('userId', userId)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },

  async setDefault(addressId, userId) {
    await supabaseAdmin
      .from('addresses')
      .update({ isDefaultShipping: false })
      .eq('userId', userId);

    const { data, error } = await supabaseAdmin
      .from('addresses')
      .update({ isDefaultShipping: true })
      .eq('addressId', addressId)
      .eq('userId', userId)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },

  async delete(addressId, userId) {
    const { error } = await supabaseAdmin
      .from('addresses')
      .delete()
      .eq('addressId', addressId)
      .eq('userId', userId);

    if (error) throw error;
    return true;
  },
};
