import { supabaseAdmin } from '../config/supabase.js';

function formatProduct(p) {
  if (!p) return p;
  const stockQty = p.inventory?.stockQuantity ?? p.quantity ?? 0;
  const reservedQty = p.inventory?.reservedQuantity ?? 0;
  const availableQty = Math.max(0, stockQty - reservedQty);
  return {
    ...p,
    quantity: stockQty,
    stockQuantity: stockQty,
    availableQuantity: availableQty,
    inStock: availableQty > 0,
    isOutOfStock: availableQty <= 0,
  };
}

export const productRepository = {
  async findAll({
    categoryId,
    ageMin,
    ageMax,
    minPrice,
    maxPrice,
    brand,
    search,
    status = 'ACTIVE',
    includeAllStatuses = false,
    page = 1,
    limit = 20,
    sort = 'newest',
  } = {}) {
    let query = supabaseAdmin
      .from('products')
      .select(
        `
        *,
        category:categories(categoryId, name, slug),
        images:product_images(imageId, imageUrl, altText, isThumbnail, displayOrder),
        inventory:inventories(stockQuantity, reservedQuantity, lowStockThreshold)
      `,
        { count: 'exact' }
      );

    if (!includeAllStatuses) {
      query = query.eq('status', status);
    }

    if (categoryId) {
      query = query.eq('categoryId', categoryId);
    }

    if (ageMin !== undefined && ageMin !== null) {
      query = query.gte('ageMax', Number(ageMin));
    }

    if (ageMax !== undefined && ageMax !== null) {
      query = query.lte('ageMin', Number(ageMax));
    }

    if (minPrice !== undefined && minPrice !== null) {
      query = query.gte('price', Number(minPrice));
    }

    if (maxPrice !== undefined && maxPrice !== null) {
      query = query.lte('price', Number(maxPrice));
    }

    if (brand) {
      query = query.ilike('brand', `%${brand}%`);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,sku.ilike.%${search}%`);
    }

    // Sorting
    switch (sort) {
      case 'price_asc':
        query = query.order('price', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('price', { ascending: false });
        break;
      case 'name_asc':
        query = query.order('name', { ascending: true });
        break;
      case 'newest':
      default:
        query = query.order('createdAt', { ascending: false });
        break;
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, count, error } = await query;
    if (error) throw error;

    const formattedProducts = (data || []).map(formatProduct);

    return {
      products: formattedProducts,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  },

  async findByIdOrSlug(idOrSlug) {
    if (!idOrSlug) return null;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

    let query = supabaseAdmin
      .from('products')
      .select(
        `
        *,
        category:categories(categoryId, name, slug),
        images:product_images(imageId, imageUrl, altText, isThumbnail, displayOrder),
        inventory:inventories(stockQuantity, reservedQuantity, lowStockThreshold)
      `
      );

    if (isUuid) {
      query = query.eq('productId', idOrSlug);
    } else {
      const cleanSlug = String(idOrSlug).trim();
      const altSlug = cleanSlug.includes('_') ? cleanSlug.replace(/_/g, '-') : cleanSlug.replace(/-/g, '_');
      query = query.or(`slug.eq.${cleanSlug},slug.eq.${altSlug},slug.ilike.%${cleanSlug}%,sku.ilike.%${cleanSlug}%`);
    }

    const { data, error } = await query.limit(1).maybeSingle();
    if (error) throw error;
    return formatProduct(data);
  },

  async create(productData) {
    const {
      categoryId,
      name,
      slug,
      sku,
      description,
      price,
      compareAtPrice,
      ageMin = 0,
      ageMax = 99,
      brand,
      weightGrams = 0,
      status = 'ACTIVE',
    } = productData;

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert({
        categoryId,
        name,
        slug,
        sku,
        description,
        price,
        compareAtPrice,
        ageMin,
        ageMax,
        brand,
        weightGrams,
        status,
      })
      .select('*')
      .single();

    if (error) throw error;
    return formatProduct(data);
  },

  async update(productId, updateData) {
    const payload = {};
    const allowed = [
      'categoryId',
      'name',
      'slug',
      'sku',
      'description',
      'price',
      'compareAtPrice',
      'ageMin',
      'ageMax',
      'brand',
      'weightGrams',
      'status',
    ];

    for (const key of allowed) {
      if (updateData[key] !== undefined) {
        payload[key] = updateData[key];
      }
    }

    if (Object.keys(payload).length > 0) {
      const { data, error } = await supabaseAdmin
        .from('products')
        .update(payload)
        .eq('productId', productId)
        .select('*')
        .single();

      if (error) throw error;
      return formatProduct(data);
    }

    return this.findByIdOrSlug(productId);
  },

  async archive(productId) {
    const { data, error } = await supabaseAdmin
      .from('products')
      .update({ status: 'ARCHIVED' })
      .eq('productId', productId)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },

  async addImage({ productId, imageUrl, altText, isThumbnail = false, displayOrder = 0 }) {
    const { data, error } = await supabaseAdmin
      .from('product_images')
      .insert({
        productId,
        imageUrl,
        altText,
        isThumbnail,
        displayOrder,
      })
      .select('*')
      .single();

    if (error) throw error;
    return data;
  },

  async removeImage(imageId) {
    const { error } = await supabaseAdmin
      .from('product_images')
      .delete()
      .eq('imageId', imageId);

    if (error) throw error;
    return true;
  },
};
