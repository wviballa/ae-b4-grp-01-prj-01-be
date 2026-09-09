# 🧸 Toy Store Backend API

A decoupled, high-performance REST API backend for the Toy Store website, built with **Node.js**, **Express**, and **Supabase (PostgreSQL)**.

---

## 🚀 Quick Start

### 1. Installation
Dependencies are already installed. If needed, run:
```bash
npm install
```

### 2. Environment Setup
Copy [.env.example](file:///.env.example) to `.env`:
```bash
cp .env.example .env
```
Update `.env` with your Supabase credentials once you have your project:
- `SUPABASE_URL`: Found under Supabase Dashboard > Project Settings > API
- `SUPABASE_ANON_KEY`: Found under Project Settings > API (Public Anon key)
- `SUPABASE_SERVICE_ROLE_KEY`: Found under Project Settings > API (Secret Service Role key)

### 3. Database Migration (When Supabase is Ready)
Open the **Supabase SQL Editor** and execute the files in order:
1. [database/schema.sql](file:///database/schema.sql): Creates all 14 tables, triggers, indexes, and constraints.
2. [database/seed.sql](file:///database/seed.sql): Populates initial flat categories, sample toys, images, and inventory.
3. [database/rls_policies.sql](file:///database/rls_policies.sql): Enables Supabase Row Level Security rules.

### 4. Running the Server Locally
To run with live reload (`nodemon`):
```bash
npm run dev
```

To run in production mode:
```bash
npm start
```

Default server URL: `http://localhost:5000`
Health check: `http://localhost:5000/api/v1/health`

---

## 🏛️ Architecture & Separation of Concerns

```
src/
├── config/            # Supabase clients & centralized environment config
├── utils/             # Standard API envelope, custom ApiError, and constants
├── middleware/        # JWT auth, RBAC role guard, rate limiting, error handlers
├── repositories/      # Isolated Supabase DB queries (user, product, cart, order, etc.)
├── services/          # Business logic, stock reservation, checkout calculations
├── controllers/       # HTTP request & response handlers
├── routes/            # REST endpoint routers (/api/v1/...)
├── app.js             # Express app with CORS, Helmet, rate-limiter
└── server.js          # HTTP server bootstrap listener
```

---

## 📦 API Endpoints Overview (`/api/v1`)

| Domain | Method & Endpoint | Description |
| :--- | :--- | :--- |
| **Auth** | `POST /api/v1/auth/register` | Register customer account & profile |
| | `POST /api/v1/auth/login` | Authenticate and obtain JWT access & refresh tokens |
| | `POST /api/v1/auth/refresh-token` | Exchange refresh token for new access token |
| | `GET /api/v1/profile` | Get current authenticated user profile |
| | `PUT /api/v1/profile` | Update profile information |
| **Addresses** | `GET /api/v1/addresses` | List saved shipping addresses |
| | `POST /api/v1/addresses` | Create a new address |
| | `PATCH /api/v1/addresses/:id/default` | Mark address as default shipping |
| **Catalog** | `GET /api/v1/categories` | List active flat toy categories |
| | `GET /api/v1/categories/:slug` | Get category details |
| | `GET /api/v1/products` | Search & filter toys (by age, price, brand, category) |
| | `GET /api/v1/products/:idOrSlug` | Detailed product view with inventory & images |
| **Cart** | `GET /api/v1/cart` | Get cart items, stock validity, and subtotal |
| | `POST /api/v1/cart/items` | Add product to cart (guest or customer) |
| | `PUT /api/v1/cart/items/:id` | Update line item quantity |
| | `DELETE /api/v1/cart/items/:id` | Remove line item |
| | `POST /api/v1/cart/merge` | Merge guest session cart into customer account |
| **Orders** | `POST /api/v1/orders/checkout-summary` | Preview subtotal, shipping fee, and taxes |
| | `POST /api/v1/orders` | Place order with atomic inventory reservation |
| | `GET /api/v1/orders` | Customer order history |
| | `GET /api/v1/orders/:orderId` | Single order details |
| | `GET /api/v1/orders/:orderId/receipt` | Order invoice receipt |
| **Payments** | `POST /api/v1/payments/create-intent` | Initialize payment intent for order |
| | `POST /api/v1/payments/webhook` | Process payment gateway webhook confirmation |
| **Shipments** | `GET /api/v1/shipments/track/:trackingNumber` | Public tracking lookup |
| **Admin** | `GET /api/v1/admin/reports/overview` | BI summary: revenue, orders, stock alerts |
| | `GET /api/v1/admin/inventory` | Real-time stock audit and low-stock alerts |
| | `POST /api/v1/admin/orders/:id/fulfill` | Assign tracking number and ship order |
