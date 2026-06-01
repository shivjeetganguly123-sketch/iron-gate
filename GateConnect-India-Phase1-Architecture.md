# GateConnect India — Phase 1: System Architecture

*A nationwide marketplace connecting gate & grill manufacturers, fabricators, and dealers with buyers across India. Platform owner (Admin) controls transactions and earns 5% commission per completed order.*

---

## 1. Architectural Overview

GateConnect is built as a **modular monolith** on the backend with a clear layered architecture, paired with a **server-rendered Next.js frontend** for SEO.

**Why a modular monolith (not microservices) at launch:**
- Faster to build, test, and operate with a small team.
- Single deployable unit, simpler transactions across orders/payments/commission (which must stay consistent).
- Internally split into clean service modules (Auth, Catalog, Orders, Payments, Reviews, Admin) so any module can later be extracted into its own service once traffic justifies it.

**Why Next.js for the frontend:**
- SSR + ISR (Incremental Static Regeneration) gives Google fully-rendered HTML for product, seller, and city landing pages — essential for the SEO goals in Phase 13.
- Same React/TypeScript skillset across the stack.

The system targets thousands of concurrent users via stateless API servers behind a load balancer, Redis for caching/sessions/rate-limiting, a CDN for media, and background workers for anything slow (emails, WhatsApp, invoices, settlement reports).

---

## 2. Technology Stack & Rationale

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js (App Router), React, TypeScript, Tailwind, Framer Motion | SSR/ISR for SEO, type safety, fast modern UI |
| Backend | Node.js, Express, TypeScript | Matches your spec; shared language with frontend |
| Architecture | Controllers → Services → Repositories | Clean separation, testable business logic |
| Database | MongoDB + Mongoose | Flexible product specs (gates have varied attributes), your spec |
| Cache / sessions / rate-limit | Redis | Fast reads, refresh-token store, abuse protection |
| Background jobs | BullMQ (on Redis) | Async notifications, invoice/settlement generation, webhooks retries |
| Media storage | Cloudinary **or** AWS S3 + CloudFront | Image/video transforms, CDN delivery, offloads API |
| Payments | Razorpay (Orders API + Webhooks; **Razorpay Route** for split settlement) | Required; Route enables automatic commission capture |
| Auth | JWT access + refresh tokens in httpOnly secure cookies | Stateless API, XSS-resistant token storage |
| Search/filter | MongoDB indexes + text search at launch; Meilisearch later | Good enough early, upgradeable |
| Infra | Docker, Nginx reverse proxy, cloud host (AWS/GCP/Render) | Portable, reproducible deploys |

---

## 3. System Architecture (component view)

```
┌──────────────────────────── CLIENTS ────────────────────────────┐
│  Buyer Web/Mobile (Next.js)   Seller Dashboard   Admin Panel     │
└───────────────────────────────┬─────────────────────────────────┘
                                 │  HTTPS
                        ┌────────▼─────────┐
                        │   CDN / Nginx    │  (TLS, static, reverse proxy)
                        └────────┬─────────┘
                                 │
                ┌────────────────▼─────────────────┐
                │     Express API (TypeScript)      │
                │  Middleware: auth, validation,    │
                │  rate-limit, CSRF, error handler  │
                │  Services: Auth | Catalog |       │
                │  Orders | Payments | Reviews |    │
                │  Commission | Admin               │
                └───┬───────┬───────┬──────────┬────┘
                    │       │       │          │
        ┌───────────▼─┐ ┌───▼───┐ ┌─▼───────┐ ┌▼──────────────┐
        │  MongoDB    │ │ Redis │ │ Object  │ │ Background     │
        │ (primary +  │ │ cache │ │ storage │ │ workers        │
        │  replicas)  │ │ +jobs │ │ (media) │ │ (BullMQ)       │
        └─────────────┘ └───────┘ └─────────┘ └──┬─────────────┘
                                                  │
                          ┌───────────────────────▼───────────────────┐
                          │ External services                         │
                          │  Razorpay · Email (SES) · SMS · WhatsApp  │
                          └───────────────────────────────────────────┘
```

*(A rendered version of this is shown inline in the chat.)*

---

## 4. Database Architecture (overview — full schemas in Phase 2)

MongoDB collections and how they relate. Default to **referencing** for entities that change independently, and **embedding** for tightly-coupled, read-together data.

- **Users** — base identity (email, hashed password, role: `buyer` | `seller` | `admin`, status). One auth model, role-based.
- **Sellers** — references `Users`. Shop profile, KYC (GST/PAN/license docs), verification status, payout account ID (Razorpay Route).
- **Buyers** — references `Users`. Addresses, preferences.
- **Products** — references `Sellers`. Title, category, material, dimensions, pricing (product/installation/delivery), media URLs, service area, status (`draft`/`published`). Embedded specs object for flexible attributes.
- **Orders** — references `Buyer`, `Seller`, `Product`. Snapshotted price + address + status timeline (embedded array of status changes), payment refs, commission amount.
- **Payments** — references `Order`. Razorpay IDs, type (`advance`/`balance`/`refund`), amount, status, settlement/split detail.
- **Reviews** — references `Buyer`, `Seller`, `Product`, `Order` (only reviewable after completion). Sub-ratings: product quality, installation, communication.
- **Wishlist** — references `Buyer` + `Product`.
- **Inquiries** — buyer↔seller pre-order messages, references `Product`.
- **Notifications** — per-user feed, references `User`.
- **Complaints** — references `Order`/`User`, handled by Admin.
- **Admin** — admin-specific settings, audit logs.

**Key relationship rule:** Orders **snapshot** the price and product details at purchase time rather than relying on live `Products` data, so later edits to a listing never change a historical order or commission.

**Indexing strategy (preview):** compound indexes on `Products(category, city, price)` and `Products(seller, status)`; text index on `Products(title, description)`; `Orders(seller, status)` and `Orders(buyer, createdAt)`; unique indexes on `Users.email`, `Sellers.gstNumber`.

---

## 5. User Flows

**Buyer journey:**
Land on home/SEO page → search/filter by category, city, material, price, rating → product detail → (Contact/WhatsApp seller *or* place order) → enter installation address + preferred date + notes → see cost breakdown → pay 20% advance (Razorpay) → track order through status timeline → on completion, leave review.

**Seller journey:**
Register with KYC docs → wait for Admin verification → add designs (draft/publish) → receive order notification → accept/reject → progress order through manufacturing/installation statuses → receive settled payout (order value − 5% commission) → view earnings and reviews.

---

## 6. Marketplace Workflow

1. Seller registers and uploads GST/PAN/license → status `pending`.
2. Admin reviews KYC → `approved` (can publish) or `rejected`.
3. Approved seller publishes products → visible in catalog/search.
4. Buyer discovers product → places order with advance payment.
5. Platform holds/controls funds, notifies seller.
6. Seller fulfils through the order state machine.
7. On completion, platform settles payout to seller minus 5% commission and records revenue.
8. Buyer reviews; complaints (if any) escalate to Admin.

---

## 7. Order Workflow (state machine)

Orders move forward through a controlled state machine — transitions are validated server-side (you can't jump straight to "Installation Completed").

```
Order Received → Seller Accepted → Measurement Scheduled →
Manufacturing Started → Manufacturing Completed → Ready For Delivery →
Installation Scheduled → Installation Completed → Order Closed
```

- **Rejection branch:** at *Order Received*, seller may reject → order cancelled, advance auto-refunded.
- Each transition appends `{status, timestamp, actor, note}` to the order's embedded timeline (this powers live tracking).
- Buyer-visible "live tracking" simply reads this timeline; sellers (and admin) drive the transitions.

---

## 8. Payment Workflow

This is the most important design area because the platform "controls the complete transaction," so money should flow **through the platform**, not directly to sellers.

**Recommended model — Aggregator + split settlement (Razorpay Route):**
1. Buyer pays the **20% advance** into the platform's Razorpay account (`Payment.type = advance`).
2. Razorpay webhook confirms payment → order is created/activated (never trust the client; trust the webhook).
3. Balance **80%** is collected online before the *Installation Scheduled* milestone (`Payment.type = balance`) — keeping the full transaction on-platform so the 5% commission applies to the entire order value.
4. On **Order Closed**, the seller's payout (order value − 5%) is settled via **Razorpay Route** to the seller's linked account; the 5% is retained as platform revenue.
5. Cancellations/refunds handled via Razorpay refunds, with rules per status (e.g., refundable before manufacturing starts).

**Idempotency & integrity:** every payment action keys off Razorpay's `order_id`/`payment_id`; webhooks are verified by signature and processed idempotently so retries never double-charge or double-settle.

> ⚠️ **Open decision (needs your input):** Is the **80% balance** collected **online through the platform**, or **offline (cash/UPI) directly to the seller**? This single choice changes the database, payment, and commission design substantially. I recommend online-through-platform so your 5% applies to the full order value and you keep control. See Section 12.

---

## 9. Commission Workflow

- Commission rate stored in config (default **5%**), so you can change it later without code changes.
- Commission is computed on the **full order value** (product + installation + delivery, per your decision in Section 8) and stored on the order at creation as a snapshot.
- Example (your spec): Order ₹50,000 → Commission ₹2,500 → Seller receives ₹47,500.
- A **Revenue/Settlement** module aggregates commission across orders for the admin dashboard, generates seller earnings reports, and produces settlement records that reconcile against Razorpay payouts.

> Note: Indian e-commerce operators have GST and TCS obligations on marketplace transactions, and holding/settling buyer funds has regulatory implications. The payment-flow and tax design should be reviewed with a chartered accountant and Razorpay's onboarding/compliance team. I'm not a legal or financial advisor — flagging this so it's designed correctly from day one.

---

## 10. Admin Workflow

Admin is the control center: verify/approve/reject sellers (KYC), manage products/orders/payments/reviews/complaints/users, and view the revenue + commission dashboard. Every sensitive admin action is written to an **audit log** (who did what, when). Admin auth is separated by role and protected with the same JWT system plus optional 2FA.

---

## 11. Security Architecture

- **Authentication:** JWT access token (short-lived) + refresh token, both in **httpOnly, Secure, SameSite cookies** (not localStorage) to resist XSS token theft.
- **Passwords:** bcrypt hashing with a sensible work factor; never stored or logged in plaintext.
- **Authorization:** role-based access control (buyer/seller/admin) enforced in middleware on every protected route; sellers can only touch their own products/orders.
- **Input validation:** schema validation (e.g., Zod) on every endpoint; reject unknown fields.
- **Injection/XSS:** Mongoose sanitization, output encoding, strict Content-Security-Policy.
- **CSRF:** CSRF tokens for cookie-based state-changing requests.
- **Rate limiting & abuse protection:** Redis-backed limits on auth, search, and payment endpoints.
- **Transport:** HTTPS everywhere, HSTS, secure headers (Helmet).
- **Payments:** verify Razorpay webhook signatures; never compute price/commission on the client.
- **Secrets:** environment variables / secret manager, never in the repo.
- **File uploads:** type/size validation, virus scanning consideration, signed URLs for media.

---

## 12. Decisions That Shape Everything Downstream

Before I build Phase 2 (database), please confirm or adjust these — they ripple through every later phase:

1. **Balance payment (80%):** online-through-platform (recommended) or offline-to-seller?
2. **Pricing model for custom work:** Gates are often custom-measured. Your order flow has *Measurement Scheduled* **after** the order is placed. Do you want (a) fixed-price listings only, or (b) support a **revised quote after measurement** step where the seller adjusts the final price and the buyer re-confirms? This affects orders, payments, and commission math.
3. **Settlement timing:** settle seller payout at *Order Closed* (recommended) or earlier?
4. **Auth identity:** single login that can be both buyer and seller, or strictly separate accounts per role?

My recommendations are baked into the architecture above; just tell me where you differ.

---

## 13. Proposed Folder Structure (preview — detailed in Phase 14)

```
gateconnect/
├── apps/
│   ├── api/        # Express + TS backend (controllers, services, repos, routes, middleware)
│   └── web/        # Next.js frontend
├── packages/
│   └── shared/     # shared TS types, validation schemas, constants
├── docker/         # Dockerfiles, compose
└── infra/          # CI/CD, deploy, monitoring config
```

---

### Status

✅ **Phase 1 complete.** Awaiting your confirmation (and answers to Section 12) before starting **Phase 2 — Database Design**.
