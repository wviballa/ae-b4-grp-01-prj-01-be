import { supabaseAdmin } from '../src/config/supabase.js';

async function seed() {
  console.log('--- 🌾 SEEDING INITIAL TOY STORE DATA ---');

  // 1. Categories
  const categories = [
    { categoryId: 'c1000000-0000-0000-0000-000000000001', name: 'Action Figures', slug: 'action-figures', description: 'Superheroes, anime figures, and adventure collectibles', imageUrl: 'https://images.unsplash.com/photo-1608889175123-8ee362201f81?auto=format&fit=crop&w=600&q=80', sortOrder: 1, isActive: true },
    { categoryId: 'c1000000-0000-0000-0000-000000000002', name: 'Building Sets', slug: 'building-sets', description: 'LEGO sets, modular bricks, and creative architectural kits', imageUrl: 'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?auto=format&fit=crop&w=600&q=80', sortOrder: 2, isActive: true },
    { categoryId: 'c1000000-0000-0000-0000-000000000003', name: 'Board Games & Puzzles', slug: 'board-games-puzzles', description: 'Family board games, card games, and jigsaw challenges', imageUrl: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=600&q=80', sortOrder: 3, isActive: true },
    { categoryId: 'c1000000-0000-0000-0000-000000000004', name: 'Plush Toys', slug: 'plush-toys', description: 'Soft teddy bears, cute animal plushes, and bedtime friends', imageUrl: 'https://images.unsplash.com/photo-1559454403-b8fb88521f11?auto=format&fit=crop&w=600&q=80', sortOrder: 4, isActive: true },
    { categoryId: 'c1000000-0000-0000-0000-000000000005', name: 'Outdoor & Sports', slug: 'outdoor-sports', description: 'Ride-on cars, scooters, balls, and backyard water toys', imageUrl: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=600&q=80', sortOrder: 5, isActive: true },
    { categoryId: 'c1000000-0000-0000-0000-000000000006', name: 'STEM & Educational', slug: 'stem-educational', description: 'Robotics, science discovery kits, and coding games', imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80', sortOrder: 6, isActive: true }
  ];

  const { error: catErr } = await supabaseAdmin.from('categories').upsert(categories, { onConflict: 'slug' });
  if (catErr) console.warn('Categories error:', catErr.message);
  else console.log('✅ Categories seeded!');

  // 2. Products
  const products = [
    { productId: 'a2000000-0000-0000-0000-000000000001', categoryId: 'c1000000-0000-0000-0000-000000000002', name: 'Space Galaxy Explorer Starship', slug: 'space-galaxy-explorer-starship', sku: 'TOY-BLD-001', description: 'Build and pilot the ultimate interstellar exploration vessel.', price: 79.99, compareAtPrice: 99.99, ageMin: 8, ageMax: 14, brand: 'BrickMaster', weightGrams: 850.00, status: 'ACTIVE' },
    { productId: 'a2000000-0000-0000-0000-000000000002', categoryId: 'c1000000-0000-0000-0000-000000000001', name: 'Cyber-Mech Defender Figure 12"', slug: 'cyber-mech-defender-figure', sku: 'TOY-ACT-002', description: 'Articulated robot warrior with missile launchers and sound effects.', price: 34.99, compareAtPrice: 39.99, ageMin: 6, ageMax: 12, brand: 'TitanForce', weightGrams: 420.00, status: 'ACTIVE' },
    { productId: 'a2000000-0000-0000-0000-000000000003', categoryId: 'c1000000-0000-0000-0000-000000000004', name: 'Barnaby The Cuddle Bear', slug: 'barnaby-the-cuddle-bear', sku: 'TOY-PLS-003', description: 'Ultra-soft hypoallergenic plush bear made from recycled materials.', price: 24.50, compareAtPrice: 29.99, ageMin: 1, ageMax: 99, brand: 'WarmSnuggles', weightGrams: 310.00, status: 'ACTIVE' },
    { productId: 'a2000000-0000-0000-0000-000000000004', categoryId: 'c1000000-0000-0000-0000-000000000003', name: 'Mystic Island Quest Strategy Board Game', slug: 'mystic-island-quest', sku: 'TOY-BRD-004', description: 'Cooperative 2-4 player board game navigating mysterious islands.', price: 45.00, compareAtPrice: 49.99, ageMin: 10, ageMax: 99, brand: 'TabletopArcadia', weightGrams: 1200.00, status: 'ACTIVE' },
    { productId: 'a2000000-0000-0000-0000-000000000005', categoryId: 'c1000000-0000-0000-0000-000000000006', name: 'Smart Bot Solar Rover Coding Kit', slug: 'smart-bot-solar-rover-coding-kit', sku: 'TOY-STM-005', description: 'Learn STEM principles by assembling a solar-powered vehicle.', price: 59.99, compareAtPrice: 69.99, ageMin: 8, ageMax: 16, brand: 'FutureInventors', weightGrams: 600.00, status: 'ACTIVE' }
  ];

  const { error: prodErr } = await supabaseAdmin.from('products').upsert(products, { onConflict: 'slug' });
  if (prodErr) console.warn('Products error:', prodErr.message);
  else console.log('✅ Products seeded!');

  // 3. Images
  const images = [
    { productId: 'a2000000-0000-0000-0000-000000000001', imageUrl: 'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?auto=format&fit=crop&w=800&q=80', altText: 'Starship Main View', displayOrder: 1, isThumbnail: true },
    { productId: 'a2000000-0000-0000-0000-000000000002', imageUrl: 'https://images.unsplash.com/photo-1608889175123-8ee362201f81?auto=format&fit=crop&w=800&q=80', altText: 'Cyber-Mech Defender Main Pose', displayOrder: 1, isThumbnail: true },
    { productId: 'a2000000-0000-0000-0000-000000000003', imageUrl: 'https://images.unsplash.com/photo-1559454403-b8fb88521f11?auto=format&fit=crop&w=800&q=80', altText: 'Barnaby Bear Sitting', displayOrder: 1, isThumbnail: true },
    { productId: 'a2000000-0000-0000-0000-000000000004', imageUrl: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=800&q=80', altText: 'Mystic Island Game Board', displayOrder: 1, isThumbnail: true },
    { productId: 'a2000000-0000-0000-0000-000000000005', imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80', altText: 'Solar Rover Lab Kit', displayOrder: 1, isThumbnail: true }
  ];

  const { error: imgErr } = await supabaseAdmin.from('product_images').insert(images);
  if (imgErr) console.warn('Images warning:', imgErr.message);
  else console.log('✅ Product Images seeded!');

  // 4. Inventories
  const inventories = [
    { productId: 'a2000000-0000-0000-0000-000000000001', stockQuantity: 45, reservedQuantity: 0, lowStockThreshold: 5, trackQuantity: true },
    { productId: 'a2000000-0000-0000-0000-000000000002', stockQuantity: 20, reservedQuantity: 0, lowStockThreshold: 3, trackQuantity: true },
    { productId: 'a2000000-0000-0000-0000-000000000003', stockQuantity: 100, reservedQuantity: 0, lowStockThreshold: 10, trackQuantity: true },
    { productId: 'a2000000-0000-0000-0000-000000000004', stockQuantity: 15, reservedQuantity: 0, lowStockThreshold: 4, trackQuantity: true },
    { productId: 'a2000000-0000-0000-0000-000000000005', stockQuantity: 30, reservedQuantity: 0, lowStockThreshold: 5, trackQuantity: true }
  ];

  const { error: invErr } = await supabaseAdmin.from('inventories').upsert(inventories, { onConflict: 'productId' });
  if (invErr) console.warn('Inventories error:', invErr.message);
  else console.log('✅ Inventories seeded!');

  console.log('--- 🎉 SEEDING COMPLETED ---');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});
