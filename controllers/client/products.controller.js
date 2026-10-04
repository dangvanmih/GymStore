const Product = require("../../models/product.model");
// GET: /products
module.exports.index = async (req, res) => {

  const products = await Product.find({
    status: "active",
    deleted: false
  }).sort({ position: "desc" });
  const newProducts = products.map(item => {
    item.priceNew = item.price - (item.price * item.discountPercentage / 100);
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
    const slug = req.params.slug;
    const product = await Product.findOne({
      slug: slug,
      status: "active",
      deleted: false
    });

    // Chuyển Mongoose Document thành Plain Object để gán thêm thuộc tính priceNew
    const productDetail = product.toObject();

    // Tính giá mới (làm tròn số nguyên để tránh số thập phân lẻ)
    const discount = productDetail.discountPercentage || 0;
    productDetail.priceNew = Math.round(
      productDetail.price * (1 - discount / 100)
    );

    res.render("client/pages/products/detail", {
      pageTitle: product.title,
      product: productDetail
    });
  }
  catch (error) {
    res.redirect(req.get("Referer") || `${systemConfig.prefixAdmin}/products`);
  }
}