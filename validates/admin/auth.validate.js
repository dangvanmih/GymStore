module.exports.loginPost = async (req, res, next) => {
  // Kiểm tra dữ liệu đầu vào
  if (req.body.email == "" || req.body.password == "") {
    req.flash("error", "Vui lòng nhập email");
    return res.redirect(req.get("Referer"));
  };

  // Kiểm tra dữ liệu đầu vào
  if (req.body.email == "" || req.body.password == "") {
    req.flash("error", "Vui lòng nhập mật khẩu!");
    return res.redirect(req.get("Referer"));
  };
  next();
}
