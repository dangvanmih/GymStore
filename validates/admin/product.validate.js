module.exports.createPost = async (req, res, next) => {
  // Kiểm tra dữ liệu đầu vào
  if (req.body.title == "" || req.body.price == "" || req.body.discountPercentage == "" || req.body.stock == "") {
    req.flash("error", "Vui lòng nhập đầy đủ thông tin sản phẩm!");
    return res.redirect(req.get("Referer") || `${systemConfig.prefixAdmin}/products/create`);
  };
  next();
}
