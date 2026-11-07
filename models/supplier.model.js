const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  contactName: { type: String, trim: true, default: "" },
  phone: { type: String, trim: true, default: "" },
  email: { type: String, trim: true, lowercase: true, default: "" },
  address: { type: String, trim: true, default: "" },
  description: { type: String, trim: true, default: "" },
  status: { type: String, enum: ["active", "inactive"], default: "active" },
  deleted: { type: Boolean, default: false },
  deletedAt: Date
}, { timestamps: true });

module.exports = mongoose.model("Supplier", supplierSchema, "suppliers");
