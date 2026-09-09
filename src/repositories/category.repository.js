import { supabaseAdmin } from '../config/supabase.js';

export const categoryRepository = {
  async findAll({ onlyActive = true } = {}) {
    let query = supabaseAdmin
      .from('categories')
      .select('*')
      .order('sortOrder', { ascending: true })
      .order('name', { ascending: true });

    if (onlyActive) {
      query = query.eq('isActive', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async findBySlug(slug) {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async findById(categoryId) {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('categoryId', categoryId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async create(categoryData) {
    const { name, slug, description, imageUrl, isActive = true, sortOrder = 0 } = categoryData;
    const { data, error } = await supabaseAdmin
      .from('categories')
      .insert({
        name,
        slug,
        description,
        imageUrl,
        isActive,
        sortOrder,
      })
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },

  async update(categoryId, updateData) {
    const payload = {};
    const fields = ['name', 'slug', 'description', 'imageUrl', 'isActive', 'sortOrder'];
    for (const field of fields) {
      if (updateData[field] !== undefined) {
        payload[field] = updateData[field];
      }
    }

    const { data, error } = await supabaseAdmin
      .from('categories')
      .update(payload)
      .eq('categoryId', categoryId)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },

  async delete(categoryId) {
    const { error } = await supabaseAdmin
      .from('categories')
      .delete()
      .eq('categoryId', categoryId);

    if (error) throw error;
    return true;
  },
};
