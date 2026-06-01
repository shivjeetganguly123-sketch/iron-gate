/**
 * GateConnect India — Mongoose models (Phase 2)
 * All 12 collections with TypeScript interfaces, validation, and indexes.
 *
 * Usage:
 *   import { User, Seller, Buyer, Product, Order, Payment, Review,
 *            Wishlist, Inquiry, Notification, Complaint, Admin } from "./models";
 */
import { Schema, model, models, Types, Document } from "mongoose";

/* ----------------------------- shared types ----------------------------- */
export const CATEGORIES = [
  "Main Gate", "Sliding Gate", "Folding Gate", "Stainless Steel Gate",
  "MS Gate", "Balcony Grill", "Window Grill", "Staircase Grill",
  "Decorative Gate", "Compound Gate", "Fabrication Product",
] as const;

export const ORDER_STATUSES = [
  "Order Received", "Seller Accepted", "Measurement Scheduled",
  "Manufacturing Started", "Manufacturing Completed", "Ready For Delivery",
  "Installation Scheduled", "Installation Completed", "Order Closed",
  "Cancelled",
] as const;

const GSTIN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PAN = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const PINCODE = /^[1-9][0-9]{5}$/;
const MOBILE = /^[6-9][0-9]{9}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const AddressSchema = new Schema(
  {
    label: { type: String, default: "Home" },
    line: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, match: PINCODE },
    isDefault: { type: Boolean, default: false },
  },
  { _id: false }
);

const ServiceAreaSchema = new Schema(
  { city: { type: String, required: true }, state: { type: String, required: true } },
  { _id: false }
);

/* --------------------------------- users -------------------------------- */
export interface IUser extends Document {
  email: string; passwordHash: string;
  role: "buyer" | "seller" | "admin";
  status: "pending" | "active" | "suspended";
  emailVerified: boolean; name: string; phone?: string;
}
const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, match: EMAIL },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["buyer", "seller", "admin"], required: true },
    status: { type: String, enum: ["pending", "active", "suspended"], default: "active" },
    emailVerified: { type: Boolean, default: false },
    name: { type: String, required: true, trim: true },
    phone: { type: String, match: MOBILE },
    verifyToken: String, verifyTokenExp: Date,
    resetToken: String, resetTokenExp: Date,
    lastLoginAt: Date,
  },
  { timestamps: true }
);
userSchema.index({ role: 1, status: 1 });

/* -------------------------------- sellers ------------------------------- */
export interface ISeller extends Document {
  userId: Types.ObjectId; shopName: string; ownerName: string;
  gstNumber: string; panNumber: string;
  verificationStatus: "pending" | "approved" | "rejected";
}
const sellerSchema = new Schema<ISeller>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    shopName: { type: String, required: true, trim: true },
    ownerName: { type: String, required: true, trim: true },
    address: { type: AddressSchema, required: true },
    email: { type: String, required: true, lowercase: true, match: EMAIL },
    mobile: { type: String, required: true, match: MOBILE },
    whatsapp: { type: String, match: MOBILE },
    gstNumber: { type: String, required: true, unique: true, uppercase: true, match: GSTIN },
    panNumber: { type: String, required: true, unique: true, uppercase: true, match: PAN },
    documents: {
      gstCertificate: { type: String, required: true },
      panCard: { type: String, required: true },
      shopLicense: String,
    },
    verificationStatus: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    rejectionReason: String,
    payoutAccountId: String, // Razorpay Route linked account
    serviceAreas: { type: [ServiceAreaSchema], default: [] },
    ratingAvg: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);
sellerSchema.index({ verificationStatus: 1 });
sellerSchema.index({ "address.city": 1, "address.state": 1 });

/* -------------------------------- buyers -------------------------------- */
const buyerSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    fullName: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, match: MOBILE },
    addresses: { type: [AddressSchema], default: [] },
  },
  { timestamps: true }
);

/* ------------------------------- products ------------------------------- */
export interface IProduct extends Document {
  sellerId: Types.ObjectId; title: string; slug: string;
  category: (typeof CATEGORIES)[number];
  pricingType: "fixed" | "quote";
  status: "draft" | "published" | "archived";
}
const productSchema = new Schema<IProduct>(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: "Seller", required: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true, maxlength: 5000 },
    category: { type: String, enum: CATEGORIES, required: true },
    material: { type: String, required: true },
    dimensions: {
      height: { type: Number, min: 0 },
      width: { type: Number, min: 0 },
      weight: { type: Number, min: 0 },
    },
    color: String,
    finish: String,
    pricing: {
      productPrice: { type: Number, required: true, min: 0 },
      installationCharges: { type: Number, default: 0, min: 0 },
      deliveryCharges: { type: Number, default: 0, min: 0 },
    },
    pricingType: { type: String, enum: ["fixed", "quote"], default: "fixed" },
    media: {
      images: { type: [String], validate: (v: string[]) => v.length <= 12 },
      videos: { type: [String], default: [] },
    },
    serviceArea: { type: [ServiceAreaSchema], default: [] },
    specs: { type: Schema.Types.Mixed, default: {} },
    status: { type: String, enum: ["draft", "published", "archived"], default: "draft" },
    ratingAvg: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);
productSchema.index({ category: 1, "serviceArea.city": 1, "pricing.productPrice": 1 });
productSchema.index({ sellerId: 1, status: 1 });
productSchema.index({ title: "text", description: "text", material: "text" });

/* -------------------------------- orders -------------------------------- */
const StatusEventSchema = new Schema(
  {
    status: { type: String, enum: ORDER_STATUSES, required: true },
    at: { type: Date, default: Date.now },
    by: { type: Schema.Types.ObjectId, ref: "User" },
    note: String,
  },
  { _id: false }
);
const orderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    buyerId: { type: Schema.Types.ObjectId, ref: "Buyer", required: true },
    sellerId: { type: Schema.Types.ObjectId, ref: "Seller", required: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    productSnapshot: {
      title: String, category: String, material: String,
      dimensions: Object, media: Object,
    },
    installation: {
      address: { type: AddressSchema, required: true },
      preferredDate: Date,
      notes: String,
    },
    pricing: {
      productPrice: { type: Number, required: true },
      installationCharges: { type: Number, default: 0 },
      deliveryCharges: { type: Number, default: 0 },
      total: { type: Number, required: true },
      advanceAmount: { type: Number, required: true }, // 20% of total
      balanceAmount: { type: Number, required: true }, // 80% of total
      commissionRate: { type: Number, default: 0.05 },
      commissionAmount: { type: Number, required: true }, // total * rate
      sellerPayout: { type: Number, required: true }, // total - commission
    },
    pricingType: { type: String, enum: ["fixed", "quote"], default: "fixed" },
    revisedQuote: {
      amount: Number,
      note: String,
      status: { type: String, enum: ["proposed", "accepted", "rejected"] },
      respondedAt: Date,
    },
    status: { type: String, enum: ORDER_STATUSES, default: "Order Received" },
    statusTimeline: { type: [StatusEventSchema], default: [] },
    payments: [{ type: Schema.Types.ObjectId, ref: "Payment" }],
  },
  { timestamps: true }
);
orderSchema.index({ buyerId: 1, createdAt: -1 });
orderSchema.index({ sellerId: 1, status: 1 });
orderSchema.index({ status: 1 });

/* ------------------------------- payments ------------------------------- */
const paymentSchema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    buyerId: { type: Schema.Types.ObjectId, ref: "Buyer", required: true },
    sellerId: { type: Schema.Types.ObjectId, ref: "Seller", required: true },
    type: { type: String, enum: ["advance", "balance", "refund"], required: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: "INR" },
    razorpay: { orderId: String, paymentId: String, signature: String },
    status: { type: String, enum: ["created", "paid", "failed", "refunded"], default: "created" },
    settlement: { transferId: String, settledAt: Date },
    invoiceUrl: String,
    failureReason: String,
  },
  { timestamps: true }
);
paymentSchema.index({ orderId: 1, type: 1 });
paymentSchema.index({ "razorpay.paymentId": 1 }, { unique: true, sparse: true });
paymentSchema.index({ status: 1 });

/* -------------------------------- reviews ------------------------------- */
const reviewSchema = new Schema(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true, unique: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    sellerId: { type: Schema.Types.ObjectId, ref: "Seller", required: true },
    buyerId: { type: Schema.Types.ObjectId, ref: "Buyer", required: true },
    ratings: {
      productQuality: { type: Number, required: true, min: 1, max: 5 },
      installationQuality: { type: Number, required: true, min: 1, max: 5 },
      communication: { type: Number, required: true, min: 1, max: 5 },
    },
    overall: { type: Number, min: 1, max: 5 },
    comment: { type: String, maxlength: 2000 },
    images: { type: [String], default: [] },
  },
  { timestamps: true }
);
reviewSchema.pre("save", function (next) {
  const r = (this as any).ratings;
  (this as any).overall =
    Math.round(((r.productQuality + r.installationQuality + r.communication) / 3) * 10) / 10;
  next();
});
reviewSchema.index({ productId: 1, createdAt: -1 });
reviewSchema.index({ sellerId: 1 });

/* ------------------------------- wishlist ------------------------------- */
const wishlistSchema = new Schema({
  buyerId: { type: Schema.Types.ObjectId, ref: "Buyer", required: true },
  productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  addedAt: { type: Date, default: Date.now },
});
wishlistSchema.index({ buyerId: 1, productId: 1 }, { unique: true });

/* ------------------------------ inquiries ------------------------------- */
const inquirySchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    sellerId: { type: Schema.Types.ObjectId, ref: "Seller", required: true },
    buyerId: { type: Schema.Types.ObjectId, ref: "Buyer", required: true },
    messages: [
      {
        from: { type: String, enum: ["buyer", "seller"], required: true },
        text: { type: String, required: true },
        at: { type: Date, default: Date.now },
      },
    ],
    status: { type: String, enum: ["open", "closed"], default: "open" },
  },
  { timestamps: true }
);
inquirySchema.index({ sellerId: 1, status: 1 });
inquirySchema.index({ buyerId: 1 });

/* ----------------------------- notifications ---------------------------- */
const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: String,
    data: { type: Schema.Types.Mixed },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

/* ------------------------------ complaints ------------------------------ */
const complaintSchema = new Schema(
  {
    raisedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    againstUser: { type: Schema.Types.ObjectId, ref: "User" },
    orderId: { type: Schema.Types.ObjectId, ref: "Order" },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ["open", "in_review", "resolved", "closed"], default: "open" },
    resolution: String,
  },
  { timestamps: true }
);
complaintSchema.index({ status: 1, createdAt: -1 });

/* -------------------------------- admins -------------------------------- */
const adminSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    permissions: { type: [String], default: [] },
    twoFactorEnabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

/* ----------------------- export (HMR-safe pattern) ---------------------- */
export const User = models.User || model<IUser>("User", userSchema);
export const Seller = models.Seller || model<ISeller>("Seller", sellerSchema);
export const Buyer = models.Buyer || model("Buyer", buyerSchema);
export const Product = models.Product || model<IProduct>("Product", productSchema);
export const Order = models.Order || model("Order", orderSchema);
export const Payment = models.Payment || model("Payment", paymentSchema);
export const Review = models.Review || model("Review", reviewSchema);
export const Wishlist = models.Wishlist || model("Wishlist", wishlistSchema);
export const Inquiry = models.Inquiry || model("Inquiry", inquirySchema);
export const Notification = models.Notification || model("Notification", notificationSchema);
export const Complaint = models.Complaint || model("Complaint", complaintSchema);
export const Admin = models.Admin || model("Admin", adminSchema);
