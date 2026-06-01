/**
 * GateConnect India — seed script (Phase 2 sample data)
 * Run:  ts-node seed.ts   (after setting MONGODB_URI)
 *
 * Creates: 1 admin, 1 seller (+user, approved KYC), 1 buyer (+user),
 *          3 products, 1 in-progress order, 1 advance payment, 1 review.
 * Demonstrates the commission math: total * 0.05 = commission, 20% advance.
 */
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import {
  User, Seller, Buyer, Product, Order, Payment, Review,
} from "./models";

const URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/gateconnect";

async function seed() {
  await mongoose.connect(URI);
  await Promise.all([
    User.deleteMany({}), Seller.deleteMany({}), Buyer.deleteMany({}),
    Product.deleteMany({}), Order.deleteMany({}), Payment.deleteMany({}), Review.deleteMany({}),
  ]);

  const hash = await bcrypt.hash("Password@123", 10);

  // --- users ---
  const adminUser = await User.create({
    email: "admin@gateconnect.in", passwordHash: hash, role: "admin",
    status: "active", emailVerified: true, name: "Platform Admin",
  });
  const sellerUser = await User.create({
    email: "seller@steelcrafts.in", passwordHash: hash, role: "seller",
    status: "active", emailVerified: true, name: "Ramesh Patel", phone: "9876543210",
  });
  const buyerUser = await User.create({
    email: "buyer@example.in", passwordHash: hash, role: "buyer",
    status: "active", emailVerified: true, name: "Anita Sharma", phone: "9123456780",
  });

  // --- profiles ---
  const seller = await Seller.create({
    userId: sellerUser._id, shopName: "SteelCrafts Fabricators", ownerName: "Ramesh Patel",
    address: { line: "Plot 24, MIDC", city: "Pune", state: "Maharashtra", pincode: "411019" },
    email: "seller@steelcrafts.in", mobile: "9876543210", whatsapp: "9876543210",
    gstNumber: "27ABCDE1234F1Z5", panNumber: "ABCDE1234F",
    documents: { gstCertificate: "https://cdn/gc/gst.pdf", panCard: "https://cdn/gc/pan.pdf", shopLicense: "https://cdn/gc/lic.pdf" },
    verificationStatus: "approved", payoutAccountId: "acc_RZP_LINKED_123",
    serviceAreas: [{ city: "Pune", state: "Maharashtra" }, { city: "Mumbai", state: "Maharashtra" }],
    ratingAvg: 4.6, ratingCount: 18,
  });
  const buyer = await Buyer.create({
    userId: buyerUser._id, fullName: "Anita Sharma", mobile: "9123456780",
    addresses: [{ label: "Home", line: "12 Rose Villa, Kothrud", city: "Pune", state: "Maharashtra", pincode: "411038", isDefault: true }],
  });

  // --- products ---
  const products = await Product.create([
    {
      sellerId: seller._id, title: "Premium Stainless Steel Main Gate", slug: "premium-ss-main-gate-pune",
      description: "Heavy-duty 304-grade stainless steel main gate with mirror finish.",
      category: "Stainless Steel Gate", material: "SS 304",
      dimensions: { height: 7, width: 12, weight: 180 }, color: "Silver", finish: "Mirror",
      pricing: { productPrice: 50000, installationCharges: 3000, deliveryCharges: 2000 },
      pricingType: "fixed",
      media: { images: ["https://cdn/gc/p1-a.jpg", "https://cdn/gc/p1-b.jpg"], videos: [] },
      serviceArea: [{ city: "Pune", state: "Maharashtra" }], status: "published",
      ratingAvg: 4.7, ratingCount: 9,
    },
    {
      sellerId: seller._id, title: "Modern Sliding Gate (Automated Ready)", slug: "modern-sliding-gate-pune",
      description: "MS sliding gate, powder-coated, compatible with automation kits.",
      category: "Sliding Gate", material: "Mild Steel",
      dimensions: { height: 6, width: 16, weight: 240 }, color: "Charcoal", finish: "Powder Coated",
      pricing: { productPrice: 72000, installationCharges: 6000, deliveryCharges: 2500 },
      pricingType: "quote",
      media: { images: ["https://cdn/gc/p2-a.jpg"], videos: ["https://cdn/gc/p2.mp4"] },
      serviceArea: [{ city: "Pune", state: "Maharashtra" }], status: "published",
    },
    {
      sellerId: seller._id, title: "Decorative Balcony Grill — Floral", slug: "decorative-balcony-grill-floral-pune",
      description: "Laser-cut decorative balcony grill, rust-resistant coating.",
      category: "Balcony Grill", material: "Mild Steel",
      dimensions: { height: 4, width: 8, weight: 45 }, color: "Black", finish: "Matte",
      pricing: { productPrice: 14000, installationCharges: 1500, deliveryCharges: 800 },
      pricingType: "fixed",
      media: { images: ["https://cdn/gc/p3-a.jpg"], videos: [] },
      serviceArea: [{ city: "Pune", state: "Maharashtra" }], status: "published",
    },
  ]);

  // --- order (commission + advance math) ---
  const p = products[0];
  const total = p.pricing.productPrice + p.pricing.installationCharges + p.pricing.deliveryCharges; // 55000
  const advance = Math.round(total * 0.2);        // 11000
  const commission = Math.round(total * 0.05);    // 2750
  const order = await Order.create({
    orderNumber: "GC-2026-000123",
    buyerId: buyer._id, sellerId: seller._id, productId: p._id,
    productSnapshot: { title: p.title, category: p.category, material: p.material, dimensions: p.dimensions, media: p.media },
    installation: {
      address: buyer.addresses[0],
      preferredDate: new Date(Date.now() + 7 * 864e5),
      notes: "Gate facing east; please call before arrival.",
    },
    pricing: {
      productPrice: p.pricing.productPrice, installationCharges: p.pricing.installationCharges,
      deliveryCharges: p.pricing.deliveryCharges, total, advanceAmount: advance,
      balanceAmount: total - advance, commissionRate: 0.05, commissionAmount: commission,
      sellerPayout: total - commission,
    },
    pricingType: "fixed",
    status: "Manufacturing Started",
    statusTimeline: [
      { status: "Order Received", note: "Advance paid" },
      { status: "Seller Accepted" },
      { status: "Measurement Scheduled" },
      { status: "Manufacturing Started" },
    ],
  });

  const payment = await Payment.create({
    orderId: order._id, buyerId: buyer._id, sellerId: seller._id,
    type: "advance", amount: advance, status: "paid",
    razorpay: { orderId: "order_RZP_001", paymentId: "pay_RZP_001", signature: "sig_demo" },
  });
  order.payments = [payment._id];
  await order.save();

  await Review.create({
    orderId: order._id, productId: p._id, sellerId: seller._id, buyerId: buyer._id,
    ratings: { productQuality: 5, installationQuality: 4, communication: 5 },
    comment: "Excellent finish and on-time installation.",
  });

  console.log("Seed complete.");
  console.log({ total, advance, commission, sellerPayout: total - commission });
  await mongoose.disconnect();
}

seed().catch((e) => { console.error(e); process.exit(1); });
