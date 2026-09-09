import { supabaseAdmin } from '../config/supabase.js';

export const profileRepository = {
  async findByUserId(userId) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('userId', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createOrUpdate(userId, { firstName, lastName, phone, avatarUrl }) {
    const payload = {
      userId,
      ...(firstName !== undefined && { firstName }),
      ...(lastName !== undefined && { lastName }),
      ...(phone !== undefined && { phone }),
      ...(avatarUrl !== undefined && { avatarUrl }),
    };

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .upsert(payload)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },
};
