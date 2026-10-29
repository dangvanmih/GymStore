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
const Cart = mongoose.model("Cart", cartSchema, "carts");

module.exports = Cart;
