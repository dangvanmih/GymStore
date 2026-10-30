const mongoose = require("mongoose");

const orderProductSchema = new mongoose.Schema({
  product_id: { type: String, required: true },
  title: { type: String, required: true },
  thumbnail: { type: String, default: "" },
  size: { type: String, default: "" },
  color: { type: String, default: "" },
  quantity: { type: Number, required: true, min: 1 },
  originalPrice: { type: Number, default: 0 },
  price: { type: Number, required: true, min: 0 },
  discountPercentage: { type: Number, default: 0 },
  total: { type: Number, required: true, min: 0 }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true, sparse: true, index: true },
  customer_id: { type: String, default: "", index: true }, // reserved for a signed-in customer account
  guest_id: { type: String, default: "", index: true },
  cart_id: { type: String, default: "" },
  customer: {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, default: "", trim: true }
  },
  shippingAddress: {
    label: { type: String, default: "Nhà riêng" },
    province: { type: String, required: true },
    district: { type: String, required: true },
    ward: { type: String, required: true },
    streetAddress: { type: String, required: true },
    fullAddress: { type: String, required: true }
  },
  note: { type: String, default: "" },
  products: { type: [orderProductSchema], required: true },
  subtotal: { type: Number, required: true, min: 0 },
  discountTotal: { type: Number, default: 0, min: 0 },
  shippingFee: { type: Number, default: 0, min: 0 },
  total: { type: Number, required: true, min: 0 },
  status: {
    type: String,
    enum: ["placed", "preparing", "shipping", "delivered"],
    default: "placed",
    index: true
  },
  paymentMethod: { type: String, enum: ["cod"], default: "cod" },
  paymentStatus: { type: String, enum: ["unpaid", "paid"], default: "unpaid" },
  statusHistory: [{
    status: { type: String, enum: ["placed", "preparing", "shipping", "delivered"] },
    changedBy: { type: String, default: "" },
    note: { type: String, default: "" },
    changedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema, "orders");
