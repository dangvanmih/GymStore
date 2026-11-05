const Order = require("../../models/order.model");
const systemConfig = require("../../configs/system");
const mongoose = require("mongoose");
const { restoreOrderStock } = require("../../helpers/cancel-order");

const statusLabels = {
  placed: "Đặt hàng",
  preparing: "Chuẩn bị",
  shipping: "Đang giao",
  delivered: "Đã nhận",
  cancelled: "Đã hủy"
};

module.exports.cancel = async (req, res) => {
  const redirectTo = `${systemConfig.prefixAdmin}/orders/${req.params.id}`;
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      req.flash("error", "Không tìm thấy đơn hàng.");
      return res.redirect(`${systemConfig.prefixAdmin}/orders`);
    }
    if (order.status !== "placed") {
      req.flash("error", "Chỉ có thể hủy đơn hàng chưa được xác nhận.");
      return res.redirect(redirectTo);
    }

    const cancelled = await Order.findOneAndUpdate(
      { _id: order._id, status: "placed" },
      { $set: { status: "cancelled" }, $push: { statusHistory: {
        status: "cancelled",
        changedBy: String(res.locals.user._id),
        note: "Quản trị viên hủy đơn hàng chưa xác nhận."
      } } },
      { new: true }
    );
    if (!cancelled) {
      req.flash("error", "Đơn hàng vừa được cập nhật, bạn không thể hủy đơn này.");
      return res.redirect(redirectTo);
    }
    await restoreOrderStock(order.products);
    req.flash("success", "Đã hủy đơn hàng và hoàn lại tồn kho.");
    return res.redirect(redirectTo);
  } catch (error) {
    console.log("Lỗi hủy đơn hàng:", error);
    req.flash("error", "Không thể hủy đơn hàng lúc này.");
    return res.redirect(redirectTo);
  }
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
  if (!mongoose.Types.ObjectId.isValid(req.params.id) || !/^[a-f\d]{24}$/i.test(req.params.id)) {
    return res.status(404).send("KhÃ´ng tÃ¬m tháº¥y Ä‘Æ¡n hÃ ng.");
  }

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

    const updatedOrder = await Order.findOneAndUpdate(
      { _id: order._id, status: order.status },
      { $set: { status: targetStatus }, $push: { statusHistory: {
        status: targetStatus,
        changedBy: String(res.locals.user._id),
        note: `Admin cập nhật trạng thái: ${statusLabels[targetStatus]}.`
      } } },
      { new: true }
    );
    if (!updatedOrder) {
      req.flash("error", "Đơn hàng vừa được cập nhật. Vui lòng tải lại trang.");
      return res.redirect(`${systemConfig.prefixAdmin}/orders/${order._id}`);
    }
    req.flash("success", `Đã chuyển đơn hàng sang trạng thái “${statusLabels[targetStatus]}”.`);
    res.redirect(`${systemConfig.prefixAdmin}/orders/${order._id}`);
  } catch (error) {
    console.log("Lỗi cập nhật trạng thái đơn hàng:", error);
    req.flash("error", "Không thể cập nhật trạng thái đơn hàng.");
    res.redirect(`${systemConfig.prefixAdmin}/orders`);
  }
};
