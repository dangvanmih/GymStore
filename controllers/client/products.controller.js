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

// // GET: /products/:slug/detail
module.exports.detailProduct = async (req, res) => {
  try {
    const slug = req.params.slug;
    const product = await Product.findOne({
      slug: slug,
      status: "active",
      deleted: false
    }).lean();

    product.priceNew = Math.round(
      product.price * (1 - (product.discountPercentage || 0) / 100) / 10000
    ) * 10000;

    res.render("client/pages/products/detail", {
      pageTitle: product.title,
      product: product
    });
  }
  catch (error) {
    console.log(error);
    res.redirect(req.get("Referer") || `${systemConfig.prefixAdmin}/products`);
  }
}



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