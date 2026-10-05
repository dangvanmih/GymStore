const Product = require("../../models/product.model");
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

// GET: /products/:slug
module.exports.detailProduct = async (req, res) => {
  try {
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
    res.redirect(req.get("Referer") || `${systemConfig.prefixAdmin}/products`);
  }
}