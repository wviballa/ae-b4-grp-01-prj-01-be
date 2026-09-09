import { supabaseAdmin } from '../config/supabase.js';

export const reviewRepository = {
  async findByProductId(productId, { status = 'APPROVED' } = {}) {
    let query = supabaseAdmin
      .from('reviews')
      .select(`
        reviewId,
        rating,
        title,
        comment,
        status,
        createdAt,
        user:users(
          userId,
          profile:profiles(firstName, lastName, avatarUrl)
        )
      `)
      .eq('productId', productId);

    if (status) {
      query = query.eq('status', status);
    }

    query = query.order('createdAt', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async create({ userId, productId, rating, title, comment, status = 'APPROVED' }) {
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .insert({
        userId,
        productId,
        rating,
        title,
        comment,
        status,
      })
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },

  async listForAdmin({ status = 'PENDING', page = 1, limit = 20 } = {}) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabaseAdmin
      .from('reviews')
      .select(
        `
        *,
        product:products(productId, name, slug),
        user:users(userId, email)
      `,
        { count: 'exact' }
      );

    if (status) {
      query = query.eq('status', status);
    }

    query = query.order('createdAt', { ascending: false }).range(from, to);

    const { data, count, error } = await query;
    if (error) throw error;

    return {
      reviews: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  },

  async updateStatus(reviewId, status) {
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .update({ status })
      .eq('reviewId', reviewId)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },
};
