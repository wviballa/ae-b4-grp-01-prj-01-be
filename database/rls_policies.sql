-- =====================================================================
-- Supabase Row Level Security (RLS) Policies
-- All Column Identifiers in strict camelCase
-- =====================================================================

-- Enable RLS on all tables
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "addresses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "product_images" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "inventories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "carts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "cart_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "shipments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "reviews" ENABLE ROW LEVEL SECURITY;

-- 1. Categories & Products & Images (Publicly readable by all)
CREATE POLICY "Public categories are viewable by everyone" 
ON "categories" FOR SELECT USING ("isActive" = true);

CREATE POLICY "Active products are viewable by everyone" 
ON "products" FOR SELECT USING ("status" = 'ACTIVE');

CREATE POLICY "Product images are viewable by everyone" 
ON "product_images" FOR SELECT USING (true);

-- 2. Reviews (Approved reviews are viewable by everyone)
CREATE POLICY "Approved reviews are viewable by everyone" 
ON "reviews" FOR SELECT USING ("status" = 'APPROVED');

-- 3. Profiles & Addresses (Users can view and update their own)
CREATE POLICY "Users can view own profile" 
ON "profiles" FOR SELECT USING (auth.uid() = "userId");

CREATE POLICY "Users can update own profile" 
ON "profiles" FOR UPDATE USING (auth.uid() = "userId");

CREATE POLICY "Users can manage own addresses" 
ON "addresses" FOR ALL USING (auth.uid() = "userId");

-- 4. Orders & Shipments (Users can view own orders)
CREATE POLICY "Users can view own orders" 
ON "orders" FOR SELECT USING (auth.uid() = "userId");

CREATE POLICY "Users can view own order items" 
ON "order_items" FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM "orders" WHERE "orders"."orderId" = "order_items"."orderId" AND "orders"."userId" = auth.uid()
    )
);

-- 5. Service Role Bypass
-- Note: When backend queries use SUPABASE_SERVICE_ROLE_KEY, it automatically bypasses RLS.
