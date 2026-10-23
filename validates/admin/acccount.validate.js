module.exports.createPost = async (req, res, next) => {
  // Kiểm tra dữ liệu đầu vào
  if (req.body.fullName == "" || req.body.password == "" || req.body.email == "" || req.body.role_id == "") {
    req.flash("error", "Vui lòng nhập đầy đủ thông tin cá nhân!");
    return res.redirect(req.get("Referer") || `${systemConfig.prefixAdmin}/accounts/create`);
  };
  next();
}


module.exports.editPatch = async (req, res, next) => {
  // Kiểm tra dữ liệu đầu vào
  if (req.body.fullName == "" || req.body.email == "" || req.body.role_id == "") {
    req.flash("error", "Vui lòng nhập đầy đủ thông tin cá nhân!");
    return res.redirect(req.get("Referer") || `${systemConfig.prefixAdmin}/accounts/create`);
  };
  next();
}


module.exports.editPatchProfile = async (req, res, next) => {
  // Kiểm tra dữ liệu đầu vào
  if (req.body.fullName == "" || req.body.email == "") {
    req.flash("error", "Vui lòng nhập đầy đủ thông tin cá nhân!");
    return res.redirect(req.get("Referer") || `${systemConfig.prefixAdmin}/profile`);
  };
  next();
}
