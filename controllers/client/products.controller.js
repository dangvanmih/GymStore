const Product = require("../../models/product.model");
const Category = require("../../models/category.model");

// GET: /products
module.exports.index = async (req, res) => {

  const products = await Product.find({
    status: "active",
    deleted: false
  }).sort({ position: "desc" }).lean();

  const newProducts = products.map(item => {
    item.priceNew = Math.round(
      item.price * (1 - item.discountPercentage / 100) / 10000
    ) * 10000;
    return item;
  })

  res.render("client/pages/products/index", {
    pageTitle: "Trang sản phẩm",
    products: newProducts
  });
};
// GET: /products/:slug/detail
module.exports.detailProduct = async (req, res) => {
  try {
    const slug = req.params.slug;
    const product = await Product.findOne({
      slug: slug,
      status: "active",
      deleted: false
    }).lean();

    if (!product) {
      req.flash("error", "Sản phẩm không tồn tại!");
      return res.redirect("/");
    }

    const discount = Number(product.discountPercentage) || 0;

    // 1. Xử lý logic giá cho sản phẩm CÓ phân loại (Variants) hoặc KHÔNG có phân loại
    if (product.hasVariants && product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
      // Chuẩn hóa và tính lại priceNew cho từng variant nếu cần, hoặc lấy trực tiếp
      product.variants = product.variants.map(v => {
        const vPrice = Number(v.price) || Number(product.price) || 0;
        const vPriceNew = discount > 0 
          ? Math.round((vPrice * (100 - discount) / 100) / 10000) * 10000 
          : vPrice;
        return {
          ...v,
          price: vPrice,
          priceNew: v.priceNew || vPriceNew
        };
      });

      // Mặc định lấy giá của size đầu tiên làm giá hiển thị ban đầu khi load trang
      product.price = product.variants[0].price;
      product.priceNew = product.variants[0].priceNew;
    } else {
      // Sản phẩm không có phân loại (Free size / Giá chung)
      const basePrice = Number(product.price) || 0;
      product.priceNew = discount > 0 
        ? Math.round((basePrice * (100 - discount) / 100) / 10000) * 10000 
        : basePrice;
      product.price = basePrice;
      product.variants = []; // Đảm bảo mảng rỗng để file Pug tự động ẩn phần chọn size
    }

    res.render("client/pages/products/detail", {
      pageTitle: product.title,
      product: product
    });
  } catch (error) {
    console.log("Lỗi chi tiết sản phẩm:", error);
    res.redirect("/");
  }
};


// [GET] /products/:slug
module.exports.category = async (req, res) => {
  try {
    const slug = req.params.slug;

    // 1. Tìm danh mục hiện tại theo slug
    const category = await Category.findOne({
      slug: slug,
      deleted: false,
      status: "active"
    });

    if (!category) {
      req.flash("error", "Không tìm thấy danh mục!");
      return res.redirect("/");
    }

    // 2. Lấy danh sách sản phẩm thuộc danh mục này (bao gồm cả danh mục con nếu có)
    // (Hoặc đơn giản lấy các sản phẩm có product_category_id = category.id)
    const products = await Product.find({
      product_category_id: category.id,
      deleted: false,
      status: "active"
    });

    // 3. Render ra trang danh sách sản phẩm theo danh mục
    res.render("client/pages/products/index", {
      pageTitle: category.title,
      products: products
    });
  } catch (error) {
    res.redirect("/");
  }
};

// GET: /api/search
module.exports.searchSuggestion = async (req, res) => {
  try {
    const keyword = req.query.keyword || "";
    
    if (!keyword.trim()) {
      return res.json({ products: [], total: 0 });
    }

    // Tạo biểu thức chính quy (regex) không phân biệt hoa thường để tìm kiếm gần đúng
    const regex = new RegExp(keyword, "i");

    // Tìm kiếm các sản phẩm khớp với tiêu đề và chưa bị xóa, đang active
    const products = await Product.find({
      title: regex,
      status: "active",
      deleted: false
    }).limit(5).lean(); // Lấy tối đa 5 sản phẩm

    // Đếm tổng số lượng sản phẩm khớp từ khóa (để hiển thị "Xem thêm X sản phẩm")
    const total = await Product.countDocuments({
      title: regex,
      status: "active",
      deleted: false
    });

    res.json({
      products: products,
      total: total,
      keyword: keyword
    });
  } catch (error) {
    console.log("Lỗi Live Search:", error);
    res.json({ products: [], total: 0 });
  }
};