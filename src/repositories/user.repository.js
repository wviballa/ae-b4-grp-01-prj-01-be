import { supabaseAdmin } from '../config/supabase.js';

export const userRepository = {
  async findByEmail(email) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async findById(userId) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('userId, email, role, status, createdAt, updatedAt')
      .eq('userId', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async create({ email, passwordHash, role = 'CUSTOMER', status = 'UNVERIFIED' }) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({
        email: email.toLowerCase(),
        passwordHash,
        role,
        status,
      })
      .select('userId, email, role, status, createdAt')
      .single();

    if (error) throw error;
    return data;
  },

  async verifyEmail(userId) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ status: 'ACTIVE' })
      .eq('userId', userId)
      .select('userId, email, role, status')
      .single();

    if (error) throw error;
    return data;
  },

  async updateStatus(userId, status) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ status })
      .eq('userId', userId)
      .select('userId, email, role, status')
      .single();

    if (error) throw error;
    return data;
  },
};

