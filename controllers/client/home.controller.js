const Category = require("../../models/category.model");
const Product = require("../../models/product.model");
const { calculateProductsPrice } = require("../../helpers/productPrice");

// [GET] /
module.exports.index = async (req, res) => {
  try {
    // 1. Lấy ra các danh mục gốc
    const parentCategories = await Category.find({
      $or: [
        { parent_id: "" },
        { parent_id: null },
        { parent_id: { $exists: false } }
      ],
      deleted: false,
      status: "active"
    }).lean();

    const categoriesWithProducts = [];

    for (const category of parentCategories) {
      const subCategories = await Category.find({
        parent_id: category._id.toString(),
        deleted: false,
        status: "active"
      }).lean();

      const listCategoryId = [category._id];
      subCategories.forEach(sub => {
        listCategoryId.push(sub._id);
      });

      // 2. Tìm tất cả sản phẩm thuộc danh mục
      const products = await Product.find({
        category_id: { $in: listCategoryId },
        deleted: false,
        status: "active"
      }).limit(8).lean();

      // 3. Sử dụng helper để tính giá cho mảng sản phẩm của danh mục
      const newProducts = calculateProductsPrice(products);

      categoriesWithProducts.push({
        title: category.title,
        slug: category.slug,
        products: newProducts
      });
    }

    // 4. Lấy ra sản phẩm nổi bật
    const productFeatured = await Product.find({
      featured: "1",
      deleted: false,
      status: "active"
    });

    // Sử dụng helper để tính giá cho sản phẩm nổi bật cực kỳ nhanh gọn
    const newProductFeatured = calculateProductsPrice(productFeatured);

    res.render("client/pages/home/index", {
      pageTitle: "Trang chủ",
      categoriesWithProducts: categoriesWithProducts,
      productFeatured: newProductFeatured
    });
  } catch (error) {
    console.log(error);
    res.render("client/pages/home/index", {
      pageTitle: "Trang chủ",
      categoriesWithProducts: []
    });
  }
};