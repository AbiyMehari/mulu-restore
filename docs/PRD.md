# Product Requirements Document (PRD)
## Project: Mulu ReStore – eCommerce Platform

---

## 1. Overview

Mulu ReStore is a full-stack eCommerce web application for curated vintage and restored furniture.

The platform is built using **Next.js (App Router)** and **MongoDB (Mongoose)** and includes:
- a public storefront,
- user authentication,
- cart and checkout,
- Stripe payments,
- an admin dashboard with analytics,
- and AI-assisted product description generation.

This PRD is the **single source of truth** for development and must be followed strictly.

---

## 2. Objectives

1. Provide a fast, responsive, SEO-friendly shopping experience.
2. Support secure authentication and role-based access control.
3. Enable efficient product, order, and inventory management.
4. Provide business insights via an admin analytics dashboard.
5. Reduce manual content creation using AI-generated product descriptions.
6. Maintain clean, scalable, and maintainable architecture.

---

## 3. User Roles

### 3.1 Customer
- Browse products
- View product details
- Add products to cart and wishlist
- Checkout and pay
- View order history
- Manage profile and addresses

### 3.2 Admin
- Create, update, and soft-delete products
- Manage categories
- Upload and manage images
- Manage orders and update order status
- Manage users and roles
- View analytics dashboards
- Generate AI-based product descriptions

---

## 4. Functional Requirements

---

### 4.1 Authentication & Authorization

- Authentication implemented with **NextAuth.js**
- JWT-based sessions
- Roles: `admin`, `customer`
- Role-based access control enforced:
  - server-side (API routes)
  - route-level middleware
- Admin routes must not be accessible to customers

---

### 4.2 Product Management

#### Product fields:
- title
- slug
- price (stored in cents)
- currency (EUR)
- stock quantity
- category (reference)
- images (Cloudinary URLs)
- short description
- full description
- condition (vintage / restored / used)
- attributes:
  - material
  - style
  - era
- dimensions:
  - width
  - height
  - depth
  - weight
- shipping info:
  - pickupOnly (boolean)
  - shippingPossible (boolean)
  - shippingNotes
- isActive (boolean)
- isDeleted (soft delete)
- viewCount
- createdAt / updatedAt

#### Admin capabilities:
- Create product
- Update product
- Soft delete product
- Upload multiple images
- Generate descriptions using AI
- View product analytics

---

### 4.3 Categories

- Admin-managed categories
- Each category has:
  - name
  - slug
- Used for filtering and analytics

---

### 4.4 Shopping Experience

- Product listing page with:
  - pagination
  - category filter
  - search
- Product detail page with image gallery
- Shopping cart:
  - add/remove items
  - update quantities
  - validate stock
- Wishlist per authenticated user

---

### 4.5 Checkout & Orders

#### Checkout flow:
1. Address selection or creation
2. Order summary
3. Stripe Checkout session
4. Payment confirmation
5. Order confirmation page

#### Order fields:
- user snapshot
- product snapshots (title, price, image)
- subtotal
- shipping cost
- total amount
- currency
- address snapshot
- status:
  - pending_payment
  - paid
  - processing
  - shipped
  - delivered
  - cancelled
  - refunded
- Stripe references:
  - checkoutSessionId
  - paymentIntentId
- timestamps

Orders must be marked **paid only via Stripe webhook verification**.

---

### 4.6 Payments

- Stripe Checkout integration
- Webhook verification required
- No client-side payment confirmation logic
- All amounts calculated server-side

---

### 4.7 Admin Dashboard & Analytics

#### Metrics:
- Total products
- Total orders
- Total revenue
- Revenue (last 7 / 30 days)
- Average order value
- Low-stock products

#### Charts:
- Sales trends (daily)
- Top-selling products
- Category distribution
- Stock level summary
- Product popularity (view counts)

Analytics must be implemented using **MongoDB aggregation pipelines**.

---

### 4.8 AI Product Description Generator

Admin-only feature.

#### Inputs:
- product title
- category
- material
- dimensions
- condition
- style / era

#### Outputs:
- short description
- long description
- SEO title
- meta description
- keyword tags

Generated content must be editable before saving.

---

## 5. Non-Functional Requirements

- Server-side rendering and ISR for SEO
- Optimized image delivery
- Secure API routes
- Input validation with Zod
- Clean folder structure
- No business logic in client components
- CI must pass lint, typecheck, and build

---

## 6. Tech Stack

### Frontend
- Next.js (App Router)
- React
- Tailwind CSS

### Backend
- Next.js Route Handlers
- Node.js
- MongoDB + Mongoose

### Integrations
- NextAuth.js
- Stripe
- Cloudinary
- AI provider (LLM)

---

## 7. Target Folder Structure

