const generateHelper = require("../../helpers/generate");
const { sendMail } = require("../../helpers/sendMail");
const User = require("../../models/user.model");
const bcrypt = require("bcrypt");
const Cart = require("../../models/cart.model");
const Order = require("../../models/order.model");

module.exports.login = (req, res) => {
  if (req.user) return res.redirect("/");
  res.render("client/pages/user/login", { pageTitle: "Đăng nhập tài khoản" });
};

module.exports.loginPost = async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const user = await User.findOne({ email, deleted: false });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      req.flash("error", "Email hoặc mật khẩu không chính xác.");
      return res.redirect("/user/login");
    }
    if (user.status !== "active") {
      req.flash("error", "Tài khoản chưa được xác thực. Vui lòng hoàn tất xác thực email.");
      return res.redirect("/user/login");
    }
    await linkOrdersToAccount(user);
    await establishCustomerSession(req, res, user);
    req.flash("success", "Đăng nhập thành công!");
    const returnTo = String(req.body.returnTo || "");
    res.redirect(returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/");
  } catch (error) {
    console.log("Lỗi đăng nhập khách hàng:", error);
    req.flash("error", "Không thể đăng nhập lúc này. Vui lòng thử lại.");
    res.redirect("/user/login");
  }
};

module.exports.logout = (req, res) => {
  res.clearCookie("tokenUser");
  res.clearCookie("cartId");
  req.flash("success", "Bạn đã đăng xuất.");
  res.redirect("/");
};

async function establishCustomerSession(req, res, user) {
  const guestCartId = req.cookies.cartId;
  let guestCart = guestCartId ? await Cart.findById(guestCartId) : null;
  let accountCart = await Cart.findOne({ user_id: String(user._id) });

  if (!accountCart && guestCart) {
    accountCart = guestCart;
    accountCart.user_id = String(user._id);
    accountCart.expiresAt = undefined;
    await accountCart.save();
  } else if (accountCart && guestCart && String(accountCart._id) !== String(guestCart._id)) {
    for (const item of guestCart.products) {
      const match = accountCart.products.find(existing => String(existing.product_id) === String(item.product_id) && (existing.size || "") === (item.size || "") && (existing.color || "") === (item.color || ""));
      if (match) match.quantity += item.quantity;
      else accountCart.products.push({ product_id: item.product_id, quantity: item.quantity, size: item.size, color: item.color });
    }
    await accountCart.save();
    await guestCart.deleteOne();
  }
  if (accountCart) res.cookie("cartId", String(accountCart._id), { maxAge: 24 * 60 * 60 * 1000, httpOnly: true, sameSite: "lax" });

  const cookieFavorites = String(req.cookies.favoriteIds || "").split(",").filter(id => /^[a-f\d]{24}$/i.test(id));
  const favorites = [...new Set([...(user.favoriteIds || []).map(String), ...cookieFavorites])];
  user.favoriteIds = favorites;
  await user.save();
  res.cookie("favoriteIds", favorites.join(","), { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true, sameSite: "lax" });
  res.cookie("tokenUser", user.tokenUser, { httpOnly: true, sameSite: "lax" });
}

async function linkOrdersToAccount(user) {
  if (!user.email) return;
  const escapedEmail = user.email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  await Order.updateMany(
    {
      "customer.email": new RegExp(`^${escapedEmail}$`, "i"),
      $or: [{ customer_id: "" }, { customer_id: { $exists: false } }]
    },
    { $set: { customer_id: String(user._id) } }
  );
}

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
    await establishCustomerSession(req, res, user);

    req.flash("success", "Xác thực tài khoản thành công!");
    res.redirect("/");
  } catch (error) {
    console.log("Lỗi xác thực OTP:", error);
    req.flash("error", "Đã có lỗi xảy ra!");
    res.redirect("Referer");
  }
};
