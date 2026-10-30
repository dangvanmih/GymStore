const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  owner_id: { type: String, required: true, index: true },
  customer_id: { type: String, default: undefined }, // legacy field for addresses saved before guest_id separation
  label: { type: String, default: "Nhà riêng", trim: true },
  recipientName: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, default: "", trim: true },
  province: { type: String, required: true, trim: true },
  district: { type: String, required: true, trim: true },
  ward: { type: String, required: true, trim: true },
  streetAddress: { type: String, required: true, trim: true },
  isDefault: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model("Address", addressSchema, "addresses");
