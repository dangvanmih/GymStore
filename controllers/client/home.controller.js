const Category = require("../../models/category.model");
const Product = require("../../models/product.model");

// [GET] /
module.exports.index = async (req, res) => {
  try {
    // 1. Lấy ra các danh mục gốc (danh mục cha như Áo, Quần, Phụ kiện...)
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
      // Lấy tất cả các danh mục con thuộc danh mục cha này
      const subCategories = await Category.find({
        parent_id: category._id.toString(),
        deleted: false,
        status: "active"
      }).lean();

      // Gom tất cả ID bao gồm ID của danh mục cha và các danh mục con của nó
      const listCategoryId = [category._id];
      subCategories.forEach(sub => {
        listCategoryId.push(sub._id);
      });

      // 2. Tìm tất cả sản phẩm thuộc danh mục cha hoặc các danh mục con dựa vào category_id
      const products = await Product.find({
        category_id: { $in: listCategoryId },
        deleted: false,
        status: "active"
      }).limit(8).lean();

      // 3. Tính toán giá mới (priceNew) nếu sản phẩm có phần trăm giảm giá
      products.forEach(item => {
        let displayPrice = 0;
        let displayPriceNew = 0;
        let discount = Number(item.discountPercentage) || 0;

        // 1. Nếu sản phẩm có phân loại (variants)
        if (item.hasVariants && item.variants && Array.isArray(item.variants) && item.variants.length > 0) {
          const validVariants = item.variants.filter(v => v.priceNew && v.priceNew > 0);

          if (validVariants.length > 0) {
            // Lấy biến thể có giá mới nhỏ nhất (size bé nhất)
            const minVariant = validVariants.reduce((min, current) => current.priceNew < min.priceNew ? current : min);

            displayPriceNew = minVariant.priceNew;
            displayPrice = minVariant.price || Number(item.price) || 0;
          }
        }

        // 2. Nếu sản phẩm KHÔNG CÓ SIZE (Sản phẩm thường / Giá chung)
        if (displayPriceNew === 0) {
          const basePrice = Number(item.price) || 0;

          // Tính toán giá mới dựa trên % giảm giá chung của sản phẩm
          if (basePrice > 0 && discount > 0) {
            displayPriceNew = Math.round((basePrice * (100 - discount) / 100) / 10000) * 10000;
            displayPrice = basePrice; // Lưu giá gốc để hiện gạch ngang
          } else {
            displayPriceNew = basePrice;
            displayPrice = basePrice; // Không giảm giá thì giá mới = giá gốc
          }
        }

        // Gán ngược lại cho item để file Pug ở trang chủ hiển thị
        item.priceNew = displayPriceNew;
        item.price = displayPrice;
      });

      categoriesWithProducts.push({
        title: category.title,
        slug: category.slug,
        products: products
      });
    }

    // Render ra trang chủ kèm theo dữ liệu danh mục và sản phẩm đã gom nhóm
    res.render("client/pages/home/index", {
      pageTitle: "Trang chủ",
      categoriesWithProducts: categoriesWithProducts
    });
  } catch (error) {
    console.log(error);
    res.render("client/pages/home/index", {
      pageTitle: "Trang chủ",
      categoriesWithProducts: []
    });
  }
};