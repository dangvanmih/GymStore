const Order = require("../../models/order.model");
const systemConfig = require("../../configs/system");

const statusLabels = {
  placed: "Đặt hàng",
  preparing: "Chuẩn bị",
  shipping: "Đang giao",
  delivered: "Đã nhận"
};
// Admin xử lý đến bước đang giao; khách hàng xác nhận bước đã nhận.
const nextStatus = { placed: "preparing", preparing: "shipping" };
const nextAction = {
  placed: "Xác nhận đơn hàng",
  preparing: "Chuyển sang đang giao"
};

module.exports.index = async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 }).lean();
  res.render("admin/pages/order/index", {
    pageTitle: "Quản lý đơn hàng",
    orders,
    statusLabels
  });
};

module.exports.detail = async (req, res) => {
  const order = await Order.findById(req.params.id).lean();
  if (!order) {
    req.flash("error", "Không tìm thấy đơn hàng.");
    return res.redirect(`${systemConfig.prefixAdmin}/orders`);
  }
  res.render("admin/pages/order/detail", {
    pageTitle: `Đơn hàng ${order.orderNumber}`,
    order,
    statusLabels,
    nextStatus: nextStatus[order.status],
    nextAction: nextAction[order.status]
  });
};

module.exports.advanceStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      req.flash("error", "Không tìm thấy đơn hàng.");
      return res.redirect(`${systemConfig.prefixAdmin}/orders`);
    }

    const targetStatus = nextStatus[order.status];
    if (order.paymentMethod === "vnpay" && order.paymentStatus !== "paid") {
      req.flash("error", "Chỉ xử lý đơn VNPay sau khi hệ thống ghi nhận thanh toán thành công.");
      return res.redirect(`${systemConfig.prefixAdmin}/orders/${order._id}`);
    }
    if (!targetStatus || targetStatus !== req.body.status) {
      req.flash("error", "Trạng thái đơn hàng không hợp lệ.");
      return res.redirect(`${systemConfig.prefixAdmin}/orders/${order._id}`);
    }

    order.status = targetStatus;
    order.statusHistory.push({
      status: targetStatus,
      changedBy: String(res.locals.user._id),
      note: `Admin cập nhật trạng thái: ${statusLabels[targetStatus]}.`
    });
    await order.save();
    req.flash("success", `Đã chuyển đơn hàng sang trạng thái “${statusLabels[targetStatus]}”.`);
    res.redirect(`${systemConfig.prefixAdmin}/orders/${order._id}`);
  } catch (error) {
    console.log("Lỗi cập nhật trạng thái đơn hàng:", error);
    req.flash("error", "Không thể cập nhật trạng thái đơn hàng.");
    res.redirect(`${systemConfig.prefixAdmin}/orders`);
  }
};
