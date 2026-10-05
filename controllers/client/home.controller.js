const Product = require("../../models/product.model");

// GET: /
module.exports.index = async (req, res) => {

  const products = await Product.find({
    status: "active",
    deleted: false
  }).lean();

  const newProducts = products.map(item => {

    item.priceNew = Math.round(
      item.price * (1 - item.discountPercentage / 100) / 10000
    ) * 10000;
    return item;
  });

  res.render("client/pages/home/index", {
    pageTitle: "Trang chủ",
    products: newProducts
  });
};