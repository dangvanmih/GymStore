const Product = require('../../models/product.model');

// GET: /admin/product
module.exports.index = async (req, res) => {

  const products = await Product.find({
    deleted: false
  })      


  res.render('admin/pages/product/index', {
    pageTitle: 'Trang sản phẩm',
    products: products
  });
}