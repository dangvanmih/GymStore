const generateHelper = require("../../helpers/generate");
const { sendMail } = require("../../helpers/sendMail");
const User = require("../../models/user.model");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const Cart = require("../../models/cart.model");
const Order = require("../../models/order.model");
const Address = require("../../models/address.model");

module.exports.profile = async (req, res) => {
  if (!req.user) return res.redirect("/user/login");
  try {
    const user = await User.findById(req.user._id).select("firstName lastName email phone");
    if (!user) return res.redirect("/user/login");
    return res.render("client/pages/user/profile", { pageTitle: "Thông tin cá nhân", user, accountSection: "profile" });
  } catch (error) {
    console.log("Lỗi tải hồ sơ khách hàng:", error);
    req.flash("error", "Không thể tải hồ sơ lúc này.");
    return res.redirect("/");
  }
};

module.exports.addresses = async (req, res) => {
  if (!req.user) return res.redirect("/user/login");
  try {
    const ownerId = String(req.user._id);
    const [user, addresses] = await Promise.all([
      User.findById(ownerId).select("firstName lastName email phone"),
      Address.find({ $or: [{ owner_id: ownerId }, { customer_id: ownerId }] }).sort({ isDefault: -1, createdAt: -1 }).lean()
    ]);
    if (!user) return res.redirect("/user/login");
    return res.render("client/pages/user/addresses", { pageTitle: "Sổ địa chỉ", user, addresses, editingAddress: null, accountSection: "addresses" });
  } catch (error) {
    console.log("Lỗi tải sổ địa chỉ:", error);
    req.flash("error", "Không thể tải sổ địa chỉ lúc này.");
    return res.redirect("/user/profile");
  }
};

module.exports.editAddress = async (req, res) => {
  if (!req.user) return res.redirect("/user/login");
  try {
    const ownerId = String(req.user._id);
    const [user, addresses, editingAddress] = await Promise.all([
      User.findById(ownerId).select("firstName lastName email phone"),
      Address.find({ $or: [{ owner_id: ownerId }, { customer_id: ownerId }] }).sort({ isDefault: -1, createdAt: -1 }).lean(),
      Address.findOne({ _id: req.params.addressId, $or: [{ owner_id: ownerId }, { customer_id: ownerId }] }).lean()
    ]);
    if (!user || !editingAddress) return res.redirect("/user/addresses");
    return res.render("client/pages/user/addresses", { pageTitle: "Chỉnh sửa địa chỉ", user, addresses, editingAddress, accountSection: "addresses" });
  } catch (error) {
    req.flash("error", "Không tìm thấy địa chỉ cần chỉnh sửa.");
    return res.redirect("/user/addresses");
  }
};

module.exports.updateAddress = async (req, res) => {
  if (!req.user) return res.redirect("/user/login");
  try {
    const ownerId = String(req.user._id);
    const fields = ["recipientName", "phone", "province", "district", "ward", "streetAddress"];
    const values = Object.fromEntries(fields.map(field => [field, String(req.body[field] || "").trim()]));
    if (fields.some(field => !values[field])) {
      req.flash("error", "Vui lòng điền đầy đủ thông tin địa chỉ.");
      return res.redirect(`/user/addresses/${req.params.addressId}/edit`);
    }
    const address = await Address.findOne({ _id: req.params.addressId, $or: [{ owner_id: ownerId }, { customer_id: ownerId }] });
    if (!address) return res.redirect("/user/addresses");
    const makeDefault = req.body.isDefault === "on";
    if (makeDefault) await Address.updateMany({ $or: [{ owner_id: ownerId }, { customer_id: ownerId }] }, { $set: { isDefault: false } });
    Object.assign(address, values, {
      label: String(req.body.label || "Nhà riêng").trim(),
      email: String(req.body.email || "").trim(),
      isDefault: makeDefault || address.isDefault
    });
    await address.save();
    req.flash("success", "Đã cập nhật địa chỉ.");
  } catch (error) {
    console.log("Lỗi cập nhật địa chỉ:", error);
    req.flash("error", "Không thể cập nhật địa chỉ lúc này.");
  }
  return res.redirect("/user/addresses");
};

module.exports.setDefaultAddress = async (req, res) => {
  if (!req.user) return res.redirect("/user/login");
  const ownerId = String(req.user._id);
  try {
    const ownerFilter = { $or: [{ owner_id: ownerId }, { customer_id: ownerId }] };
    const address = await Address.findOne({ _id: req.params.addressId, ...ownerFilter });
    if (!address) return res.redirect("/user/addresses");
    await Address.updateMany(ownerFilter, { $set: { isDefault: false } });
    address.isDefault = true;
    await address.save();
    req.flash("success", "Đã đặt địa chỉ mặc định.");
  } catch (error) {
    req.flash("error", "Không thể cập nhật địa chỉ mặc định.");
  }
  return res.redirect("/user/addresses");
};

module.exports.passwordPage = (req, res) => {
  if (!req.user) return res.redirect("/user/login");
  res.render("client/pages/user/password", { pageTitle: "Đổi mật khẩu", user: req.user, accountSection: "password" });
};

module.exports.profilePost = async (req, res) => {
  if (!req.user) return res.redirect("/user/login");
  try {
    const firstName = String(req.body.firstName || "").trim();
    const lastName = String(req.body.lastName || "").trim();
    const phone = String(req.body.phone || "").trim();
    if (!firstName || !lastName) {
      req.flash("error", "Vui lòng nhập đầy đủ họ và tên.");
      return res.redirect("/user/profile");
    }
    await User.updateOne({ _id: req.user._id }, { $set: { firstName, lastName, phone } });
    req.flash("success", "Đã cập nhật thông tin hồ sơ.");
  } catch (error) {
    console.log("Lỗi cập nhật hồ sơ khách hàng:", error);
    req.flash("error", "Không thể cập nhật hồ sơ lúc này.");
  }
  return res.redirect("/user/profile");
};

module.exports.changePassword = async (req, res) => {
  if (!req.user) return res.redirect("/user/login");
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!user || !(await bcrypt.compare(String(currentPassword || ""), user.password))) {
      req.flash("error", "Mật khẩu hiện tại không chính xác.");
      return res.redirect("/user/profile/password");
    }
    if (String(newPassword || "").length < 8) {
      req.flash("error", "Mật khẩu mới cần có ít nhất 8 ký tự.");
      return res.redirect("/user/profile/password");
    }
    if (newPassword !== confirmPassword) {
      req.flash("error", "Mật khẩu xác nhận không khớp.");
      return res.redirect("/user/profile/password");
    }
    user.password = await bcrypt.hash(newPassword, 10);
    user.tokenUser = generateHelper.generateToken(20);
    await user.save();
    res.cookie("tokenUser", user.tokenUser, { httpOnly: true, sameSite: "lax" });
    req.flash("success", "Đã đổi mật khẩu thành công.");
  } catch (error) {
    console.log("Lỗi đổi mật khẩu khách hàng:", error);
    req.flash("error", "Không thể đổi mật khẩu lúc này.");
  }
  return res.redirect("/user/profile/password");
};

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

module.exports.forgotPassword = (req, res) => {
  if (req.user) return res.redirect("/");
  return res.render("client/pages/auth/forgot-password", { pageTitle: "Quên mật khẩu" });
};

module.exports.forgotPasswordPost = async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  res.cookie("passwordResetEmail", email, { httpOnly: true, sameSite: "lax", secure: req.secure, maxAge: 10 * 60 * 1000 });
  try {
    const user = await User.findOne({ email, deleted: false, status: "active" });
    if (user) {
      const otp = generateHelper.generateNumber(6);
      user.passwordResetOtp = crypto.createHash("sha256").update(String(otp)).digest("hex");
      user.passwordResetOtpExpires = new Date(Date.now() + 10 * 60 * 1000);
      user.passwordResetOtpResendAt = new Date();
      user.passwordResetSession = undefined;
      user.passwordResetSessionExpires = undefined;
      await user.save();
      const html = `<p>Mã OTP đặt lại mật khẩu GymStore của bạn là: <b style="font-size: 22px;">${otp}</b></p><p>Mã có hiệu lực trong 10 phút.</p>`;
      try {
        await sendMail(email, "Mã OTP đặt lại mật khẩu GymStore", html);
      } catch (mailError) {
        user.passwordResetOtp = undefined;
        user.passwordResetOtpExpires = undefined;
        await user.save();
        throw mailError;
      }
    }
    req.flash("success", "Nếu email này đã đăng ký, mã OTP sẽ được gửi đến hộp thư của bạn.");
  } catch (error) {
    console.log("Lỗi gửi OTP đặt lại mật khẩu:", error);
    req.flash("error", "Chưa thể gửi email lúc này. Vui lòng thử lại sau.");
  }
  return res.redirect("/user/forgot-password/verify");
};

function maskEmail(email) {
  const [name, domain] = String(email || "").split("@");
  if (!name || !domain) return "";
  return `${name.slice(0, 1)}${"*".repeat(Math.min(Math.max(name.length - 1, 3), 6))}@${domain}`;
}

module.exports.verifyPasswordOtp = async (req, res) => {
  const email = req.cookies.passwordResetEmail || "";
  if (!email) {
    req.flash("error", "Phiên xác thực đã hết hạn. Vui lòng yêu cầu mã OTP mới.");
    return res.redirect("/user/forgot-password");
  }
  const user = await User.findOne({ email, deleted: false, status: "active" }).select("passwordResetOtpResendAt").lean();
  const elapsed = user?.passwordResetOtpResendAt ? Date.now() - new Date(user.passwordResetOtpResendAt).getTime() : 60 * 1000;
  const resendIn = Math.max(0, Math.ceil((60 * 1000 - elapsed) / 1000));
  return res.render("client/pages/auth/verify-password-otp", { pageTitle: "Xác thực OTP đặt lại mật khẩu", maskedEmail: maskEmail(email), resendIn });
};

module.exports.resendPasswordOtp = async (req, res) => {
  const email = req.cookies.passwordResetEmail || "";
  if (!email) {
    req.flash("error", "Phiên xác thực đã hết hạn. Vui lòng yêu cầu mã OTP mới.");
    return res.redirect("/user/forgot-password");
  }
  try {
    const now = Date.now();
    const user = await User.findOne({ email, deleted: false, status: "active" });
    if (user) {
      const elapsed = user.passwordResetOtpResendAt ? now - new Date(user.passwordResetOtpResendAt).getTime() : 60 * 1000;
      if (elapsed < 60 * 1000) {
        req.flash("error", `Vui lòng đợi ${Math.ceil((60 * 1000 - elapsed) / 1000)} giây trước khi gửi lại mã.`);
        return res.redirect("/user/forgot-password/verify");
      }
      const otp = generateHelper.generateNumber(6);
      user.passwordResetOtp = crypto.createHash("sha256").update(String(otp)).digest("hex");
      user.passwordResetOtpExpires = new Date(now + 10 * 60 * 1000);
      user.passwordResetOtpResendAt = new Date(now);
      user.passwordResetSession = undefined;
      user.passwordResetSessionExpires = undefined;
      await user.save();
      await sendMail(email, "Mã OTP đặt lại mật khẩu GymStore", `<p>Mã OTP đặt lại mật khẩu GymStore của bạn là: <b style="font-size: 22px;">${otp}</b></p><p>Mã có hiệu lực trong 10 phút.</p>`);
    }
    req.flash("success", "Nếu email này đã đăng ký, mã OTP mới sẽ được gửi đến hộp thư của bạn.");
  } catch (error) {
    console.log("Lỗi gửi lại OTP đặt lại mật khẩu:", error);
    req.flash("error", "Chưa thể gửi lại mã lúc này. Vui lòng thử lại sau.");
  }
  return res.redirect("/user/forgot-password/verify");
};

module.exports.verifyPasswordOtpPost = async (req, res) => {
  const email = String(req.cookies.passwordResetEmail || "").trim().toLowerCase();
  if (!email) {
    req.flash("error", "Phiên xác thực đã hết hạn. Vui lòng yêu cầu mã OTP mới.");
    return res.redirect("/user/forgot-password");
  }
  const otpHash = crypto.createHash("sha256").update(String(req.body.otp || "").trim()).digest("hex");
  const resetSession = crypto.randomBytes(32).toString("hex");
  const resetSessionHash = crypto.createHash("sha256").update(resetSession).digest("hex");
  const user = await User.findOneAndUpdate(
    { email, passwordResetOtp: otpHash, passwordResetOtpExpires: { $gt: new Date() }, deleted: false, status: "active" },
    { $set: { passwordResetSession: resetSessionHash, passwordResetSessionExpires: new Date(Date.now() + 10 * 60 * 1000) }, $unset: { passwordResetOtp: "", passwordResetOtpExpires: "" } },
    { new: true }
  );
  if (!user) {
    req.flash("error", "Email hoặc mã OTP không hợp lệ, hoặc mã đã hết hạn.");
    return res.redirect("/user/forgot-password/verify");
  }
  res.clearCookie("passwordResetEmail");
  res.cookie("passwordResetSession", resetSession, { httpOnly: true, sameSite: "lax", secure: req.secure, maxAge: 10 * 60 * 1000 });
  return res.redirect("/user/reset-password");
};

module.exports.resetPassword = async (req, res) => {
  if (!req.cookies.passwordResetSession) {
    req.flash("error", "Vui lòng xác thực mã OTP trước khi đổi mật khẩu.");
    return res.redirect("/user/forgot-password");
  }
  return res.render("client/pages/auth/reset-password", { pageTitle: "Đặt lại mật khẩu" });
};

module.exports.resetPasswordPost = async (req, res) => {
  const resetSessionHash = crypto.createHash("sha256").update(String(req.cookies.passwordResetSession || "")).digest("hex");
  const newPassword = String(req.body.newPassword || "");
  if (newPassword.length < 8) {
    req.flash("error", "Mật khẩu mới cần có ít nhất 8 ký tự.");
    return res.redirect("/user/reset-password");
  }
  if (newPassword !== String(req.body.confirmPassword || "")) {
    req.flash("error", "Mật khẩu xác nhận không khớp.");
    return res.redirect("/user/reset-password");
  }
  try {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const result = await User.updateOne(
      { passwordResetSession: resetSessionHash, passwordResetSessionExpires: { $gt: new Date() }, deleted: false, status: "active" },
      { $set: { password: passwordHash, tokenUser: generateHelper.generateToken(20) }, $unset: { passwordResetSession: "", passwordResetSessionExpires: "" } }
    );
    if (result.modifiedCount !== 1) {
      res.clearCookie("passwordResetSession");
      req.flash("error", "Phiên đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng xác thực OTP lại.");
      return res.redirect("/user/forgot-password");
    }
    res.clearCookie("tokenUser");
    res.clearCookie("passwordResetSession");
    req.flash("success", "Đặt lại mật khẩu thành công. Vui lòng đăng nhập.");
    return res.redirect("/user/login");
  } catch (error) {
    console.log("Lỗi đặt lại mật khẩu:", error);
    req.flash("error", "Không thể đặt lại mật khẩu lúc này. Vui lòng thử lại.");
    return res.redirect("/user/reset-password");
  }
};

module.exports.logout = (req, res) => {
  res.clearCookie("tokenUser");
  res.clearCookie("cartId");
  res.clearCookie("favoriteIds", { httpOnly: true, sameSite: "lax" });
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
