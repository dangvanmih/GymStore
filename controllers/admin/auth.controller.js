const Account = require("../../models/account.model");
const bcrypt = require("bcrypt");
const systemConfig = require("../../configs/system");

// GET: /admin/auth/login
module.exports.authLogin = async (req, res) => {
  try {
    const token = req.cookies.token;

    // Chưa có token thì hiển thị trang đăng nhập
    if (!token) {
      return res.render("admin/pages/auth/login", {
        pageTitle: "Đăng nhập",
      });
    }

    // Tìm tài khoản có token tương ứng
    const user = await Account.findOne({
      token: token,
      deleted: false,
    });

    // Token không hợp lệ hoặc không tìm thấy tài khoản
    if (!user) {
      return res.render("admin/pages/auth/login", {
        pageTitle: "Đăng nhập",
      });
    }

    // Đã đăng nhập hợp lệ
    return res.redirect(`${systemConfig.prefixAdmin}/dashboard`);
  } catch (error) {
    console.error("Lỗi kiểm tra đăng nhập:", error);

    return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
  }
};

// POST: /admin/auth/login
module.exports.loginPost = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    // Tìm tài khoản theo email
    const user = await Account.findOne({
      email: email,
      deleted: false
    });

    // Kiểm tra tài khoản tồn tại
    if (!user) {
      req.flash("error", "Email không tồn tại!");
      return res.redirect(req.get("Referer"));
    }

    // So sánh mật khẩu nhập vào với mật khẩu đã hash trong DB
    const isPasswordValid = await bcrypt.compare(
      password,
      user.password
    );

    if (!isPasswordValid) {
      req.flash("error", "Mật khẩu không chính xác!");
      return res.redirect(req.get("Referer"));
    }

    if (user.status == "inactive") {
      req.flash("error", "Tài khoản đã bị khóa!");
      return res.redirect(req.get("Referer"));
    }

    // trả token cho FE
    res.cookie("token", user.token);

    // Đăng nhập thành công
    req.flash("success", "Đăng nhập thành công!");
    return res.redirect(`${systemConfig.prefixAdmin}/dashboard`);

  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    req.flash("error", "Đã xảy ra lỗi khi đăng nhập!");
    return res.redirect(req.get("Referer") || `${systemConfig.prefixAdmin}/auth/login`);
  }
};

// GET: /admin/auth/login
module.exports.logout = (req, res) => {
  res.clearCookie("token");
  return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);

};