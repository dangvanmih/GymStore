const Account = require("../../models/account.model");
const systemConfig = require('../../configs/system');
const bcrypt = require('bcrypt'); 

// GET: /admin/profile
module.exports.index = async (req, res) => {

  res.render('admin/pages/profile/index', {
    pageTitle: 'Thông tin cá nhân',
  });
};

// PATCH: /admin/profile/edit
module.exports.editPatch = async (req, res) => {
  try {
    const userId = res.locals.user.id; // Hoặc lấy từ req.user tùy cấu trúc hệ thống của bạn
    const { fullName, email, phone, oldPassword, newPassword, confirmPassword } = req.body;

    // Đối tượng chứa dữ liệu sẽ cập nhật
    const updateData = {
      fullName,
      email,
      phone
    };

    // Nếu có upload ảnh avatar mới
    if (req.file) {
      updateData.avatar = `/uploads/${req.file.filename}`; // Hoặc linkCloudinary tùy cấu hình upload của bạn
    }

    // Xử lý logic đổi mật khẩu nếu người dùng nhập vào ô mật khẩu cũ/mới
    if (newPassword || oldPassword) {
      // 1. Kiểm tra xem người dùng đã nhập đủ các trường mật khẩu chưa
      if (!oldPassword || !newPassword || !confirmPassword) {
        req.flash("error", "Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới!");
      res.redirect(req.get("Referer") || `${systemConfig.prefixAdmin}/profile`);
      }

      // 2. Kiểm tra mật khẩu mới và xác nhận có trùng nhau không
      if (newPassword !== confirmPassword) {
        req.flash("error", "Mật khẩu mới và xác nhận mật khẩu không khớp!");
      res.redirect(req.get("Referer") || `${systemConfig.prefixAdmin}/profile`);
      }

      // 3. Lấy thông tin user trong DB để kiểm tra mật khẩu cũ
      const user = await Account.findById(userId);
      const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
      
      if (!isPasswordValid) {
        req.flash("error", "Mật khẩu hiện tại không chính xác!");
      res.redirect(req.get("Referer") || `${systemConfig.prefixAdmin}/profile`);
      }

      // 4. Mã hóa mật khẩu mới và gán vào dữ liệu update
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(newPassword, salt);
    }

    // Thực hiện update vào database
    await Account.updateOne({ _id: userId }, updateData);

    req.flash("success", "Cập nhật thông tin thành công!");
    res.redirect(req.get("Referer") || `${systemConfig.prefixAdmin}/profile`);

  } catch (error) {
    console.log(error);
    req.flash("error", "Đã xảy ra lỗi, vui lòng thử lại sau!");
    res.redirect(req.get("Referer") || `${systemConfig.prefixAdmin}/profile`);
  }
};