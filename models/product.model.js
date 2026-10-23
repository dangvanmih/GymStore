const mongoose = require("mongoose");
const slug = require("mongoose-slug-updater");

mongoose.plugin(slug);

// Schema cho từng Size & Tồn kho
const variantSchema = new mongoose.Schema({
  size: {
    type: String, // Ví dụ: "S", "M", "L", "XL",
    required: true,
    trim: true
  },
  stock: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  }
});

const productSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    price: Number,
    discountPercentage: Number,
    category_id: {
      type: String,
      default: ""
    },
    // Cờ đánh dấu sản phẩm có phân loại Size hay không
    hasVariants: {
      type: Boolean,
      default: false
    },

    stock: {
      type: Number,
      default: 0
    },
    // Dành cho sản phẩm Có Size (Quần, áo, đai lưng...)
    variants: [variantSchema],

    thumbnail: String,
    status: String,
    featured: String,
    position: Number,
    slug: {
      type: String,
      slug: "title",
      unique: true
    },
    createdBy: {
      account_id: String,
      createdAt: {
        type: String,
        default: Date
      }
    },
    updatedBy: [
      {
        account_id: String,
        updatedAt: {
          type: String,
          default: Date
        }
      }
    ],
    deletedBy: {
      account_id: String,
      deletedAt: {
        type: String,
        default: Date
      }
    },
    deleted: {
      type: Boolean,
      default: false
    },
    deletedAt: Date,
  },
  {
    timestamps: true
  }

);
const Product = mongoose.model("Product", productSchema, "products");
// tham số thứ nhất là tên của model
// tham số thứ 2 là cấu trúc document bên trên nó sẽ quyết định file, kiểu dữ liệu
// tham số thứ 3 Đây là tên collection thật trong MongoDB
module.exports = Product;