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

        // Kiểm tra nếu sản phẩm có phân loại (variants) và có phần tử bên trong
        if (item.hasVariants && item.variants && Array.isArray(item.variants) && item.variants.length > 0) {
          // Lọc ra các biến thể có giá mới hợp lệ (> 0)
          const validVariants = item.variants.filter(v => v.priceNew && v.priceNew > 0);

          if (validVariants.length > 0) {
            // Tìm biến thể có giá mới (priceNew) nhỏ nhất (size bé nhất hoặc giá rẻ nhất)
            const minVariant = validVariants.reduce((min, current) => current.priceNew < min.priceNew ? current : min);

            displayPriceNew = minVariant.priceNew;
            displayPrice = minVariant.price;
          }
        }

        // Nếu không có variants hoặc variants bị trống thì lấy giá chung của sản phẩm
        if (displayPriceNew === 0) {
          displayPriceNew = item.priceNew || item.price || 0;
          displayPrice = item.price || 0;
        }

        // Gán lại vào item để view Pug hiển thị chính xác
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