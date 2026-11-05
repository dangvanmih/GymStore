const Account = require("../../models/account.model");
const Role = require("../../models/role.model");
const Order = require("../../models/order.model");
const systemConfig = require("../../configs/system");
const { isAdministratorRole } = require("../../configs/permissions");

module.exports.requireAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

    const user = await Account.findOne({
      token: token,
      deleted: false
    }).select("-password");

    if (!user) {
      return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }

    const role = await Role.findById(user.role_id)
      .select("title permissions");
    if (!role) {
      return res.status(403).send("Không tìm thấy vai trò của tài khoản.");
    }

    if (isAdministratorRole(role.title)) {
      role.permissions = [...new Set([...(role.permissions || []), "roles_permission"])];
    }

    // Đưa dữ liệu ra toàn bộ file Pug
    res.locals.user = user;
    res.locals.role = role;
    // Chỉ đơn ở trạng thái placed đang chờ xác nhận mới được tính vào badge.
    res.locals.pendingOrdersCount = await Order.countDocuments({ status: "placed" });

    next();
  } catch (error) {
    next(error);
  }
};
