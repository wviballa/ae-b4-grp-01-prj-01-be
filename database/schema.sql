-- =====================================================================
-- Toy Store E-Commerce Platform Database Schema
-- All Identifiers in strict camelCase matching the ERD specification
-- Compatible with PostgreSQL 14+ / Supabase
-- =====================================================================

-- Enable UUID extension if not already available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Function to automatically manage "updatedAt" timestamps
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------
-- 1. USERS & PROFILES
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "users" (
    "userId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "email" TEXT UNIQUE NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CUSTOMER' CHECK ("role" IN ('CUSTOMER', 'ADMIN')),
    "status" TEXT NOT NULL DEFAULT 'UNVERIFIED' CHECK ("status" IN ('UNVERIFIED', 'ACTIVE', 'SUSPENDED')),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_timestamp_users
BEFORE UPDATE ON "users"
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

CREATE TABLE IF NOT EXISTS "profiles" (
    "userId" UUID PRIMARY KEY REFERENCES "users"("userId") ON DELETE CASCADE,
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER set_timestamp_profiles
BEFORE UPDATE ON "profiles"
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- ---------------------------------------------------------------------
-- 2. ADDRESSES
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "addresses" (
    "addressId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES "users"("userId") ON DELETE CASCADE,
    "recipientName" TEXT NOT NULL,
    "phone" TEXT,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "stateProvince" TEXT NOT NULL,
    "postalCode" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'USA',
    "isDefaultShipping" BOOLEAN NOT NULL DEFAULT FALSE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_addresses_userId ON "addresses"("userId");

CREATE TRIGGER set_timestamp_addresses
BEFORE UPDATE ON "addresses"
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- ---------------------------------------------------------------------
-- 3. CATEGORIES (FLAT CATEGORY ARCHITECTURE)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "categories" (
    "categoryId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT UNIQUE NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "sortOrder" INT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_slug ON "categories"("slug");

CREATE TRIGGER set_timestamp_categories
BEFORE UPDATE ON "categories"
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- ---------------------------------------------------------------------
-- 4. PRODUCTS & INVENTORIES
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "products" (
    "productId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "categoryId" UUID REFERENCES "categories"("categoryId") ON DELETE SET NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT UNIQUE NOT NULL,
    "sku" TEXT UNIQUE NOT NULL,
    "description" TEXT,
    "price" NUMERIC(10, 2) NOT NULL CHECK ("price" >= 0),
    "compareAtPrice" NUMERIC(10, 2) CHECK ("compareAtPrice" >= 0),
    "ageMin" INT NOT NULL DEFAULT 0,
    "ageMax" INT NOT NULL DEFAULT 99,
    "brand" TEXT,
    "weightGrams" NUMERIC(10, 2) DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE' CHECK ("status" IN ('DRAFT', 'ACTIVE', 'ARCHIVED')),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_categoryId ON "products"("categoryId");
CREATE INDEX IF NOT EXISTS idx_products_slug ON "products"("slug");
CREATE INDEX IF NOT EXISTS idx_products_status ON "products"("status");
CREATE INDEX IF NOT EXISTS idx_products_age ON "products"("ageMin", "ageMax");

CREATE TRIGGER set_timestamp_products
BEFORE UPDATE ON "products"
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

CREATE TABLE IF NOT EXISTS "product_images" (
    "imageId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "productId" UUID NOT NULL REFERENCES "products"("productId") ON DELETE CASCADE,
    "imageUrl" TEXT NOT NULL,
    "altText" TEXT,
    "displayOrder" INT NOT NULL DEFAULT 0,
    "isThumbnail" BOOLEAN NOT NULL DEFAULT FALSE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_images_productId ON "product_images"("productId");

CREATE TABLE IF NOT EXISTS "inventories" (
    "inventoryId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "productId" UUID NOT NULL UNIQUE REFERENCES "products"("productId") ON DELETE CASCADE,
    "stockQuantity" INT NOT NULL DEFAULT 0 CHECK ("stockQuantity" >= 0),
    "reservedQuantity" INT NOT NULL DEFAULT 0 CHECK ("reservedQuantity" >= 0),
    "lowStockThreshold" INT NOT NULL DEFAULT 5,
    "trackQuantity" BOOLEAN NOT NULL DEFAULT TRUE,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventories_productId ON "inventories"("productId");

CREATE TRIGGER set_timestamp_inventories
BEFORE UPDATE ON "inventories"
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- ---------------------------------------------------------------------
-- 5. SHOPPING CARTS & GUEST SESSIONS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "carts" (
    "cartId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID REFERENCES "users"("userId") ON DELETE CASCADE,
    "sessionToken" TEXT UNIQUE,
    "expiresAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_carts_userId ON "carts"("userId");
CREATE INDEX IF NOT EXISTS idx_carts_sessionToken ON "carts"("sessionToken");

CREATE TRIGGER set_timestamp_carts
BEFORE UPDATE ON "carts"
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

CREATE TABLE IF NOT EXISTS "cart_items" (
    "cartItemId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "cartId" UUID NOT NULL REFERENCES "carts"("cartId") ON DELETE CASCADE,
    "productId" UUID NOT NULL REFERENCES "products"("productId") ON DELETE CASCADE,
    "quantity" INT NOT NULL DEFAULT 1 CHECK ("quantity" > 0),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_cart_product UNIQUE ("cartId", "productId")
);

CREATE INDEX IF NOT EXISTS idx_cart_items_cartId ON "cart_items"("cartId");

CREATE TRIGGER set_timestamp_cart_items
BEFORE UPDATE ON "cart_items"
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- ---------------------------------------------------------------------
-- 6. ORDERS & ORDER ITEMS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "orders" (
    "orderId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID REFERENCES "users"("userId") ON DELETE SET NULL,
    "addressId" UUID REFERENCES "addresses"("addressId") ON DELETE SET NULL,
    "orderNumber" TEXT UNIQUE NOT NULL,
    "subtotalAmount" NUMERIC(10, 2) NOT NULL DEFAULT 0,
    "shippingFee" NUMERIC(10, 2) NOT NULL DEFAULT 0,
    "taxAmount" NUMERIC(10, 2) NOT NULL DEFAULT 0,
    "discountAmount" NUMERIC(10, 2) NOT NULL DEFAULT 0,
    "totalAmount" NUMERIC(10, 2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'PENDING' CHECK ("status" IN ('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED')),
    "orderNotes" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_userId ON "orders"("userId");
CREATE INDEX IF NOT EXISTS idx_orders_orderNumber ON "orders"("orderNumber");
CREATE INDEX IF NOT EXISTS idx_orders_status ON "orders"("status");

CREATE TRIGGER set_timestamp_orders
BEFORE UPDATE ON "orders"
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

CREATE TABLE IF NOT EXISTS "order_items" (
    "orderItemId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "orderId" UUID NOT NULL REFERENCES "orders"("orderId") ON DELETE CASCADE,
    "productId" UUID REFERENCES "products"("productId") ON DELETE SET NULL,
    "productName" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "quantity" INT NOT NULL CHECK ("quantity" > 0),
    "unitPrice" NUMERIC(10, 2) NOT NULL CHECK ("unitPrice" >= 0),
    "subtotal" NUMERIC(10, 2) NOT NULL CHECK ("subtotal" >= 0),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_orderId ON "order_items"("orderId");

-- ---------------------------------------------------------------------
-- 7. PAYMENTS & TRANSACTIONS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "payments" (
    "paymentId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "orderId" UUID NOT NULL REFERENCES "orders"("orderId") ON DELETE CASCADE,
    "paymentGateway" TEXT NOT NULL DEFAULT 'STRIPE',
    "transactionReference" TEXT UNIQUE,
    "amount" NUMERIC(10, 2) NOT NULL CHECK ("amount" >= 0),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "paymentMethod" TEXT NOT NULL DEFAULT 'CARD' CHECK ("paymentMethod" IN ('CARD', 'WALLET', 'CASH_ON_DELIVERY')),
    "status" TEXT NOT NULL DEFAULT 'INITIATED' CHECK ("status" IN ('INITIATED', 'SUCCESS', 'FAILED', 'REFUNDED')),
    "rawGatewayResponse" JSONB,
    "paidAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_orderId ON "payments"("orderId");
CREATE INDEX IF NOT EXISTS idx_payments_transactionReference ON "payments"("transactionReference");

CREATE TRIGGER set_timestamp_payments
BEFORE UPDATE ON "payments"
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- ---------------------------------------------------------------------
-- 8. SHIPMENTS & TRACKING
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "shipments" (
    "shipmentId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "orderId" UUID NOT NULL REFERENCES "orders"("orderId") ON DELETE CASCADE,
    "trackingNumber" TEXT UNIQUE NOT NULL,
    "carrier" TEXT NOT NULL DEFAULT 'FEDEX',
    "status" TEXT NOT NULL DEFAULT 'PENDING' CHECK ("status" IN ('PENDING', 'DISPATCHED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'RETURNED')),
    "shippedAt" TIMESTAMPTZ,
    "estimatedDeliveryAt" TIMESTAMPTZ,
    "deliveredAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipments_orderId ON "shipments"("orderId");
CREATE INDEX IF NOT EXISTS idx_shipments_trackingNumber ON "shipments"("trackingNumber");

CREATE TRIGGER set_timestamp_shipments
BEFORE UPDATE ON "shipments"
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();

-- ---------------------------------------------------------------------
-- 9. REVIEWS & RATINGS
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "reviews" (
    "reviewId" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL REFERENCES "users"("userId") ON DELETE CASCADE,
    "productId" UUID NOT NULL REFERENCES "products"("productId") ON DELETE CASCADE,
    "rating" INT NOT NULL CHECK ("rating" >= 1 AND "rating" <= 5),
    "title" TEXT,
    "comment" TEXT,
    "status" TEXT NOT NULL DEFAULT 'APPROVED' CHECK ("status" IN ('APPROVED', 'PENDING', 'REJECTED')),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_productId ON "reviews"("productId");
CREATE INDEX IF NOT EXISTS idx_reviews_userId ON "reviews"("userId");

CREATE TRIGGER set_timestamp_reviews
BEFORE UPDATE ON "reviews"
FOR EACH ROW EXECUTE FUNCTION update_timestamp_column();
