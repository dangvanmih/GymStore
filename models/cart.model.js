const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    user_id: String,
    products: [
      {
        product_id: String,
        quantity: { type: Number, default: 1, min: 1 },
        size: { type: String, default: "" },
        color: { type: String, default: "" }
      }
    ],
  },
  {
    timestamps: true
  }
);

// Tự xóa giỏ hàng sau 24 giờ, cùng thời hạn với cookie cartId.
cartSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 });

const Cart = mongoose.model("Cart", cartSchema, "carts");

module.exports = Cart;
