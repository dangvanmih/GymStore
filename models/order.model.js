const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    cart_id: String,
    // user_id: String,
    userInfo: {
      fullName:String,
      phone: String,
      address: String,
      note: String
    },
    products: [
      {
        product_id: String,
        quantity: Number,
        price: Number,
        discountPercentage: Number,
      }
    ]
  },
  {
    timestamps: true
  }
);
const Order = mongoose.model("Order", orderSchema, "orders");

module.exports = Order;
