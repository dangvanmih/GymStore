const generateHelper = require("../../helpers/generate");
const { sendMail } = require("../../helpers/sendMail");
const User = require("../../models/user.model");
const bcrypt = require("bcrypt");

//GET /user/register
module.exports.register = async (req, res) => {
  res.render("client/pages/user/register", {
    pageTitle: "Đăng ký tài khoản",
  });
}
//POST /user/register
module.exports.registerPost = async (req, res) => {
  try {
    const { email, password, confirmPassword, ...rest } = req.body;

    //  Kiểm tra mật khẩu và nhập lại mật khẩu có khớp nhau không
    if (password !== confirmPassword) {
      req.flash("error", "Mật khẩu nhập lại không chính xác!");
      return res.redirect("/user/register");
    }
    // Kiểm tra email tồn tại...
    const existUser = await User.findOne({ email: email, deleted: false });
    if (existUser && existUser.status === "active") {
      req.flash("error", "Email đã tồn tại!");
      return res.redirect("/user/register");
    }

    // Tạo mã OTP gồm 6 chữ số
    const otp = generateHelper.generateNumber(6);
    const otpExpires = Date.now() + 3 * 60 * 1000; // Hạn trong 3 phút

    // Lưu user vào database (trạng thái chưa kích hoạt)
    const hashedPassword = await bcrypt.hash(password, 10);
    if (existUser) {
      // Cho phép tiếp tục đăng ký nếu lần trước đã tạo tài khoản nhưng OTP chưa được xác thực.
      Object.assign(existUser, rest, {
        password: hashedPassword,
        otp,
        otpExpires,
        status: "inactive"
      });
      await existUser.save();
    } else {
      const newUser = new User({
        ...rest,
        email,
        password: hashedPassword,
        otp,
        otpExpires,
        status: "inactive"
      });
      await newUser.save();
    }

    // Gửi mã OTP về email người dùng
    const subject = "Mã xác thực đăng ký tài khoản GymStore";
    const html = `<p>Mã xác thực của bạn là: <b style="color: red; font-size: 20px;">${otp}</b></p>
                  <p>Mã này có hiệu lực trong vòng 3 phút.</p>`;
    await sendMail(email, subject, html);

    // Lưu email vào cookie/session để trang nhập OTP biết đang xác thực cho ai
    res.cookie("emailRegister", email);
    res.redirect("/user/otp-password");

  } catch (error) {
    console.log(error);
    req.flash("error", "Đăng ký không thành công. Vui lòng thử lại.");
    res.redirect("/");
  }
};




// [GET] /user/otp-password
module.exports.otpPassword = async (req, res) => {
  const email = req.cookies.emailRegister;
  
  res.render("client/pages/auth/otp-password", {
    pageTitle: "Nhập mã xác thực",
    email: email
  });
};

// [POST] /user/otp-password
module.exports.otpPasswordPost = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Tìm user theo email, mã otp khớp và thời gian hết hạn phải lớn hơn hiện tại ($gt)
    const user = await User.findOne({
      email: email,
      otp: otp,
      otpExpires: { $gt: Date.now() }
    });

    if (!user) {
      req.flash("error", "Mã xác thực không hợp lệ hoặc đã hết hạn!");
      return res.redirect("/user/otp-password");
    }

    // Kích hoạt tài khoản và xóa bỏ mã otp trong database
    await User.updateOne({ email: email }, {
      status: "active",
      $unset: { otp: "", otpExpires: "" }
    });

    // Xóa cookie email tạm thời
    res.clearCookie("emailRegister");

    // Đăng nhập luôn cho người dùng bằng cách gán cookie token
    res.cookie("tokenUser", user.tokenUser);

    req.flash("success", "Xác thực tài khoản thành công!");
    res.redirect("/");

  } catch (error) {
    console.log("Lỗi xác thực OTP:", error);
    req.flash("error", "Đã có lỗi xảy ra!");
    res.redirect("/user/otp-password");
  }
};
