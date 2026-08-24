const mongoose = require("mongoose");
const slug = require("mongoose-slug-updater");


mongoose.plugin(slug)


const productSchema = new mongoose.Schema(
  {
    title: String,
    // products_category_id: {
    //   type: String,
    //   default: ""
    // },
    description: String,
    price: Number,
    discountPercentage: Number,
    stock: Number,
    thumbnail: String,
    status: String,
    featured: String,
    position: Number,
    // slug: {
    //   type: String,
    //   slug: "title",
    //   unique: true
    // },
    // createdBy: {
    //   account_id: String,
    //   createdAt: {
    //     type: Date,
    //     default: Date.now
    //   }
    // },
    deleted: {
      type: Boolean,
      default: false
    },
    // deletedBy: {
    //   account_id: String,
    //   deletedAt: Date
    // },
    // updatedBy: [
    //   {
    //     account_id: String,
    //     updatedAt: Date
    //   }
    // ],
    // deletedAt: Date
  },
  // {
  //   timestamps: true
  // }
);
const Product = mongoose.model("Product", productSchema, "products");
// tham số thứ nhất là tên của model
// tham số thứ 2 là cấu trúc document bên trên nó sẽ quyết định file, kiểu dữ liệu
// tham số thứ 3 Đây là tên collection thật trong MongoDB
module.exports = Product;