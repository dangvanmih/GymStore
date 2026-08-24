const Product = require("../../models/product.model");

module.exports.index = async (req, res) => {

  const products = await Product.find({
    status: "active",
    deleted: false
  });

  const newProducts = products.map(item => {
    item.priceNew = item.price - (item.price * item.discountPercentage / 100);
    return item;
  })

  res.render("client/pages/home/index", {
    pageTitle: "Trang chủ",
    products: newProducts
  });
}