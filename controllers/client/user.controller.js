const generateHelper = require("../../helpers/generate");
const { sendMail } = require("../../helpers/sendMail");
const User = require("../../models/user.model");
const bcrypt = require("bcrypt");

//GET /user/register
module.exports.register = async (req, res) => {
  res.render("client/pages/user/register", {
    pageTitle: "Đăng ký tài khoản",
  });
};

//POST /user/register
module.exports.registerPost = async (req, res) => {
  try {
    const { email, password, confirmPassword, ...rest } = req.body;

    //  Kiểm tra mật khẩu và nhập lại mật khẩu có khớp nhau không
    if (password !== confirmPassword) {
      req.flash("error", "Mật khẩu nhập lại không chính xác!");
      return res.redirect("Referer");
    }
    // Kiểm tra email tồn tại...
    const existUser = await User.findOne({ email: email, deleted: false });
    if (existUser) {
      req.flash("error", "Email đã tồn tại!");
      return res.redirect("Referer");
    }

    // Tạo mã OTP gồm 6 chữ số
    const otp = generateHelper.generateNumber(6);
    const otpExpires = Date.now() + 3 * 60 * 1000; // Hạn trong 3 phút

    // Lưu user vào database (trạng thái chưa kích hoạt)
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      ...rest,
      email,
      password: hashedPassword, // Đã mã hóa bằng bcrypt
      otp: otp,
      otpExpires: otpExpires,
      otpResendAt: Date.now(),
      status: "inactive",
    });
    await newUser.save();

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

// [POST] /user/otp-password/resend
module.exports.resendOtp = async (req, res) => {
  try {
    const email = req.cookies.emailRegister;
    if (!email) {
      req.flash("error", "Phiên xác thực đã hết. Vui lòng đăng ký lại.");
      return res.redirect("/user/register");
    }

    const now = Date.now();
    const user = await User.findOne({ email, deleted: false, status: "inactive" });
    if (!user) {
      res.clearCookie("emailRegister");
      req.flash("error", "Không tìm thấy tài khoản cần xác thực.");
      return res.redirect("/user/register");
    }

    const cooldownMs = 60 * 1000;
    if (user.otpResendAt && now - new Date(user.otpResendAt).getTime() < cooldownMs) {
      const seconds = Math.ceil((cooldownMs - (now - new Date(user.otpResendAt).getTime())) / 1000);
      req.flash("error", `Vui lòng chờ ${seconds} giây trước khi gửi lại mã.`);
      return res.redirect("/user/otp-password");
    }

    const otp = generateHelper.generateNumber(6);
    const updatedUser = await User.findOneAndUpdate(
      {
        _id: user._id,
        status: "inactive",
        $or: [{ otpResendAt: { $lte: now } }, { otpResendAt: { $exists: false } }],
      },
      { $set: { otp, otpExpires: now + 3 * 60 * 1000, otpResendAt: now } },
      { new: true },
    );

    if (!updatedUser) {
      req.flash("error", "Mã vừa được gửi. Vui lòng kiểm tra email hoặc thử lại sau.");
      return res.redirect("/user/otp-password");
    }

    const subject = "Mã xác thực đăng ký tài khoản GymStore";
    const html = `<p>Mã xác thực của bạn là: <b style="color: red; font-size: 20px;">${otp}</b></p><p>Mã này có hiệu lực trong vòng 3 phút.</p>`;
    await sendMail(email, subject, html);

    req.flash("success", "Đã gửi mã OTP mới. Mã có hiệu lực trong 3 phút.");
    return res.redirect("/user/otp-password");
  } catch (error) {
    console.log("Lỗi gửi lại OTP:", error);
    req.flash("error", "Không thể gửi lại mã lúc này. Vui lòng thử lại.");
    return res.redirect("/user/otp-password");
  }
};

// [GET] /user/otp-password
module.exports.otpPassword = async (req, res) => {
  const email = req.cookies.emailRegister;

  res.render("client/pages/auth/otp-password", {
    pageTitle: "Nhập mã xác thực",
    email: email,
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
      otpExpires: { $gt: Date.now() },
    });

    if (!user) {
      req.flash("error", "Mã xác thực không hợp lệ hoặc đã hết hạn!");
      return res.redirect("Referer");
    }

    // Kích hoạt tài khoản và xóa bỏ mã otp trong database
    await User.updateOne(
      { email: email },
      {
        status: "active",
        $unset: { otp: "", otpExpires: "" },
      },
    );

    // Xóa cookie email tạm thời
    res.clearCookie("emailRegister");

    // Đăng nhập luôn cho người dùng bằng cách gán cookie token
    res.cookie("tokenUser", user.tokenUser);

    req.flash("success", "Xác thực tài khoản thành công!");
    res.redirect("/");
  } catch (error) {
    console.log("Lỗi xác thực OTP:", error);
    req.flash("error", "Đã có lỗi xảy ra!");
    res.redirect("Referer");
  }
};
