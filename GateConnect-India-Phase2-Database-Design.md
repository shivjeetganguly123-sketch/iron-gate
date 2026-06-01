# GateConnect India — Phase 2: Database Design (MongoDB)

This phase defines the complete data layer. It reflects the Phase 1 decisions you approved:

- **Balance (80%)** is collected online through the platform → commission applies to full order value.
- **Pricing** supports both `fixed` listings and a `quote` flow (revised price after measurement).
- **Settlement** to the seller happens at `Order Closed`.
- **Accounts** use one `users` collection with a `role` field; buyer/seller details live in separate profile collections referenced by `userId`.

Models are implemented with **Mongoose + TypeScript** (see `models.ts`). Mongoose enforces application-level validation; the design notes also indicate where MongoDB native `$jsonSchema` validators and unique indexes provide a second layer of safety.

---

## 1. Collection Map & Relationships

```
users (1) ──< sellers (1:1 profile)
users (1) ──< buyers  (1:1 profile)
users (1) ──< admins  (1:1 profile)

sellers (1) ──< products (1:N)
sellers (1) ──< orders   (1:N)
buyers  (1) ──< orders   (1:N)
products(1) ──< orders   (1:N, snapshotted)

orders  (1) ──< payments (1:N: advance, balance, refunds)
orders  (1) ──< reviews  (1:1, only after Order Closed)

buyers  (1) ──< wishlist (1:N)  → products
buyers  (1) ──< inquiries(1:N)  → products/sellers
users   (1) ──< notifications (1:N)
users   (1) ──< complaints (1:N)
```

**Embedding vs referencing rule used throughout:** reference entities that change independently and are large (users, products, orders); embed data that is read together and is naturally owned by the parent (addresses inside a buyer, status timeline inside an order, sub-ratings inside a review, product snapshot inside an order).

**Critical integrity rule:** `orders` store a **snapshot** of product title, specs, and pricing at purchase time. Later edits to a `products` document never alter historical orders, commission, or invoices.

---

## 2. Collections (field reference)

### 2.1 `users`
Base identity for all roles.

| Field | Type | Notes |
|---|---|---|
| `_id` | ObjectId | |
| `email` | string | **unique**, lowercased, validated |
| `passwordHash` | string | bcrypt; never returned in queries (`select:false`) |
| `role` | enum | `buyer` \| `seller` \| `admin` |
| `status` | enum | `pending` \| `active` \| `suspended` |
| `emailVerified` | boolean | default `false` |
| `name` | string | |
| `phone` | string | E.164/Indian mobile validated |
| `verifyToken`, `verifyTokenExp` | string/date | email verification |
| `resetToken`, `resetTokenExp` | string/date | password reset |
| `lastLoginAt` | date | |
| timestamps | date | `createdAt`, `updatedAt` |

**Indexes:** unique `{ email: 1 }`; `{ role: 1, status: 1 }`.

### 2.2 `sellers`
Seller profile + KYC. References `users._id`.

Key fields: `userId` (unique ref), `shopName`, `ownerName`, `address {line, city, state, pincode}`, `email`, `mobile`, `whatsapp`, `gstNumber` (unique, validated 15-char GSTIN pattern), `panNumber` (unique, validated PAN pattern), `documents {gstCertificate, panCard, shopLicense}` (media URLs), `verificationStatus` (`pending`|`approved`|`rejected`), `rejectionReason`, `payoutAccountId` (Razorpay Route linked account id), `serviceAreas [{city, state}]`, `ratingAvg`, `ratingCount`.

**Indexes:** unique `{ userId: 1 }`, unique `{ gstNumber: 1 }`, unique `{ panNumber: 1 }`, `{ verificationStatus: 1 }`, `{ "address.city": 1, "address.state": 1 }`.

### 2.3 `buyers`
References `users._id`. Fields: `userId` (unique ref), `fullName`, `mobile`, `addresses [{label, line, city, state, pincode, isDefault}]`.

**Indexes:** unique `{ userId: 1 }`.

### 2.4 `products`
References `sellers._id`. Fields: `sellerId`, `title`, `slug` (unique, SEO URL), `description`, `category` (enum of the 11 categories), `material`, `dimensions {height, width, weight}`, `color`, `finish`, `pricing {productPrice, installationCharges, deliveryCharges}`, `pricingType` (`fixed`|`quote`), `media {images[], videos[]}`, `serviceArea [{city, state}]`, `specs` (flexible key/value), `status` (`draft`|`published`|`archived`), `ratingAvg`, `ratingCount`.

**Indexes:** unique `{ slug: 1 }`; compound `{ category: 1, "serviceArea.city": 1, "pricing.productPrice": 1 }` (catalog filtering); `{ sellerId: 1, status: 1 }`; **text** index on `{ title, description, material }` (search).

### 2.5 `orders`
The transactional heart. References `buyerId`, `sellerId`, `productId`.

Fields: `orderNumber` (unique, human-readable e.g. `GC-2026-000123`), `buyerId`, `sellerId`, `productId`, `productSnapshot {title, category, material, dimensions, media}`, `installation {address, preferredDate, notes}`, `pricing {productPrice, installationCharges, deliveryCharges, total, advanceAmount, balanceAmount, commissionRate, commissionAmount, sellerPayout}`, `pricingType`, `revisedQuote {amount, note, status, respondedAt}` (used only when measurement changes price), `status` (10 values: the 9 statuses + `Cancelled`), `statusTimeline [{status, at, by, note}]`, `payments [ObjectId ref]`.

**Indexes:** unique `{ orderNumber: 1 }`; `{ buyerId: 1, createdAt: -1 }`; `{ sellerId: 1, status: 1 }`; `{ status: 1 }`.

**Status state machine** (enforced in the service layer):
`Order Received → Seller Accepted → Measurement Scheduled → Manufacturing Started → Manufacturing Completed → Ready For Delivery → Installation Scheduled → Installation Completed → Order Closed`, with a `Cancelled` branch reachable from early states.

### 2.6 `payments`
References `orderId`. Fields: `orderId`, `buyerId`, `sellerId`, `type` (`advance`|`balance`|`refund`), `amount`, `currency` (default `INR`), `razorpay {orderId, paymentId, signature}`, `status` (`created`|`paid`|`failed`|`refunded`), `settlement {transferId, settledAt}`, `invoiceUrl`, `failureReason`.

**Indexes:** `{ orderId: 1, type: 1 }`; unique sparse `{ "razorpay.paymentId": 1 }`; `{ status: 1 }`.

### 2.7 `reviews`
One per order, only after `Order Closed`. Fields: `orderId` (unique ref), `productId`, `sellerId`, `buyerId`, `ratings {productQuality, installationQuality, communication}` (each 1–5), `overall` (computed average), `comment`, `images []`.

**Indexes:** unique `{ orderId: 1 }`; `{ productId: 1, createdAt: -1 }`; `{ sellerId: 1 }`.

### 2.8 `wishlist`
Fields: `buyerId`, `productId`, `addedAt`. **Index:** unique compound `{ buyerId: 1, productId: 1 }`.

### 2.9 `inquiries`
Pre-order buyer↔seller messaging. Fields: `productId`, `sellerId`, `buyerId`, `messages [{from, text, at}]`, `status` (`open`|`closed`). **Index:** `{ sellerId: 1, status: 1 }`, `{ buyerId: 1 }`.

### 2.10 `notifications`
Fields: `userId`, `type`, `title`, `message`, `data` (flexible), `read` (bool). **Index:** `{ userId: 1, read: 1, createdAt: -1 }`.

### 2.11 `complaints`
Fields: `raisedBy` (userId), `againstUser` (userId, optional), `orderId` (optional), `subject`, `description`, `status` (`open`|`in_review`|`resolved`|`closed`), `resolution`. **Index:** `{ status: 1, createdAt: -1 }`.

### 2.12 `admins`
Fields: `userId` (unique ref), `permissions []` (e.g. `verify_sellers`, `manage_payments`), `twoFactorEnabled`. Sensitive admin actions are written to a separate `auditLogs` collection (`actorId`, `action`, `target`, `meta`, `at`) for traceability.

---

## 3. Validation Strategy

1. **Mongoose validators** on every field (required, enum, min/max, regex for GSTIN/PAN/pincode/mobile/email). See `models.ts`.
2. **Unique indexes** enforce identity rules at the DB (email, gstNumber, panNumber, slug, orderNumber, one-review-per-order, one-wishlist-entry-per-pair).
3. **Native `$jsonSchema`** can be attached at collection-creation time for defense in depth (rejects malformed writes even outside the app). Recommended for `orders` and `payments` where money is involved.
4. **Service-layer invariants** (not expressible as schema): order status transitions, "review only after Order Closed", "commission = total × rate", "advance = 20% of total".

---

## 4. Sample Data

A runnable seed script with realistic sample documents (users, a seller with KYC, a buyer, three products, one in-progress order, an advance payment, and a review) is provided in `seed.ts`. It uses the same models, so it doubles as a validation smoke test.

---

### Status
✅ **Phase 2 complete.** Files delivered: this design doc, `models.ts` (all 12 collections), and `seed.ts` (sample data). Next: Phase 3 backend, built in reviewable chunks (auth → products → orders → payments → reviews).
