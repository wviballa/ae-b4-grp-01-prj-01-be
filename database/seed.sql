-- =====================================================================
-- Toy Store Seed Data: Categories, Products, Images, Inventories
-- All Identifiers in strict camelCase & valid hexadecimal UUIDs
-- =====================================================================

-- 1. Insert Initial Flat Categories
INSERT INTO "categories" ("categoryId", "name", "slug", "description", "imageUrl", "sortOrder", "isActive")
VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Action Figures', 'action-figures', 'Superheroes, anime figures, and adventure collectibles', 'https://images.unsplash.com/photo-1608889175123-8ee362201f81?auto=format&fit=crop&w=600&q=80', 1, true),
  ('c1000000-0000-0000-0000-000000000002', 'Building Sets', 'building-sets', 'LEGO sets, modular bricks, and creative architectural kits', 'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?auto=format&fit=crop&w=600&q=80', 2, true),
  ('c1000000-0000-0000-0000-000000000003', 'Board Games & Puzzles', 'board-games-puzzles', 'Family board games, card games, and jigsaw challenges', 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=600&q=80', 3, true),
  ('c1000000-0000-0000-0000-000000000004', 'Plush Toys', 'plush-toys', 'Soft teddy bears, cute animal plushes, and bedtime friends', 'https://images.unsplash.com/photo-1559454403-b8fb88521f11?auto=format&fit=crop&w=600&q=80', 4, true),
  ('c1000000-0000-0000-0000-000000000005', 'Outdoor & Sports', 'outdoor-sports', 'Ride-on cars, scooters, balls, and backyard water toys', 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=600&q=80', 5, true),
  ('c1000000-0000-0000-0000-000000000006', 'STEM & Educational', 'stem-educational', 'Robotics, science discovery kits, and coding games', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80', 6, true)
ON CONFLICT ("slug") DO NOTHING;

-- 2. Insert Products
INSERT INTO "products" ("productId", "categoryId", "name", "slug", "sku", "description", "price", "compareAtPrice", "ageMin", "ageMax", "brand", "weightGrams", "status")
VALUES
  (
    'a2000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000002',
    'Space Galaxy Explorer Starship',
    'space-galaxy-explorer-starship',
    'TOY-BLD-001',
    'Build and pilot the ultimate interstellar exploration vessel with deployable rovers and light-up thrusters.',
    79.99,
    99.99,
    8,
    14,
    'BrickMaster',
    850.00,
    'ACTIVE'
  ),
  (
    'a2000000-0000-0000-0000-000000000002',
    'c1000000-0000-0000-0000-000000000001',
    'Cyber-Mech Defender Figure 12"',
    'cyber-mech-defender-figure',
    'TOY-ACT-002',
    'Articulated robot warrior with titanium finish, missile launchers, and battle sound effects.',
    34.99,
    39.99,
    6,
    12,
    'TitanForce',
    420.00,
    'ACTIVE'
  ),
  (
    'a2000000-0000-0000-0000-000000000003',
    'c1000000-0000-0000-0000-000000000004',
    'Barnaby The Cuddle Bear',
    'barnaby-the-cuddle-bear',
    'TOY-PLS-003',
    'Ultra-soft hypoallergenic plush bear made from 100% recycled cotton materials with velvet bow.',
    24.50,
    29.99,
    1,
    99,
    'WarmSnuggles',
    310.00,
    'ACTIVE'
  ),
  (
    'a2000000-0000-0000-0000-000000000004',
    'c1000000-0000-0000-0000-000000000003',
    'Mystic Island Quest Strategy Board Game',
    'mystic-island-quest',
    'TOY-BRD-004',
    'Cooperative 2-4 player board game navigating mysterious islands, ancient treasures, and tactical puzzles.',
    45.00,
    49.99,
    10,
    99,
    'TabletopArcadia',
    1200.00,
    'ACTIVE'
  ),
  (
    'a2000000-0000-0000-0000-000000000005',
    'c1000000-0000-0000-0000-000000000006',
    'Smart Bot Solar Rover Coding Kit',
    'smart-bot-solar-rover-coding-kit',
    'TOY-STM-005',
    'Learn STEM principles by assembling a solar-powered vehicle with drag-and-drop programming module.',
    59.99,
    69.99,
    8,
    16,
    'FutureInventors',
    600.00,
    'ACTIVE'
  )
ON CONFLICT ("slug") DO NOTHING;

-- 3. Insert Product Images
INSERT INTO "product_images" ("productId", "imageUrl", "altText", "displayOrder", "isThumbnail")
VALUES
  ('a2000000-0000-0000-0000-000000000001', 'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?auto=format&fit=crop&w=800&q=80', 'Starship Main View', 1, true),
  ('a2000000-0000-0000-0000-000000000002', 'https://images.unsplash.com/photo-1608889175123-8ee362201f81?auto=format&fit=crop&w=800&q=80', 'Cyber-Mech Defender Main Pose', 1, true),
  ('a2000000-0000-0000-0000-000000000003', 'https://images.unsplash.com/photo-1559454403-b8fb88521f11?auto=format&fit=crop&w=800&q=80', 'Barnaby Bear Sitting', 1, true),
  ('a2000000-0000-0000-0000-000000000004', 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=800&q=80', 'Mystic Island Game Board', 1, true),
  ('a2000000-0000-0000-0000-000000000005', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80', 'Solar Rover Lab Kit', 1, true)
ON CONFLICT DO NOTHING;

-- 4. Insert Inventories
INSERT INTO "inventories" ("productId", "stockQuantity", "reservedQuantity", "lowStockThreshold", "trackQuantity")
VALUES
  ('a2000000-0000-0000-0000-000000000001', 45, 0, 5, true),
  ('a2000000-0000-0000-0000-000000000002', 20, 0, 3, true),
  ('a2000000-0000-0000-0000-000000000003', 100, 0, 10, true),
  ('a2000000-0000-0000-0000-000000000004', 15, 0, 4, true),
  ('a2000000-0000-0000-0000-000000000005', 30, 0, 5, true)
ON CONFLICT ("productId") DO UPDATE SET "stockQuantity" = EXCLUDED."stockQuantity";
