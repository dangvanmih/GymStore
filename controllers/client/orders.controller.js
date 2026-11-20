const Order = require("../../models/order.model");
const Cart = require("../../models/cart.model");
const Product = require("../../models/product.model");
const { restoreOrderStock } = require("../../helpers/cancel-order");

const cancellationReasons = [
  "Tìm được giá tốt hơn",
  "Cần thay đổi địa chỉ",
  "Không còn nhu cầu nữa",
  "Đặt nhầm sản phẩm",
  "Thời gian giao hàng chưa phù hợp",
  "Lý do khác"
];

const statusLabels = {
  placed: "Chờ xác nhận",
  preparing: "Đang chuẩn bị",
  shipping: "Đang giao hàng",
  delivered: "Đã giao hàng",
  cancelled: "Đã hủy"
};

// POST /orders/:orderId/cancel: chỉ chủ đơn mới được hủy đơn chưa xác nhận.
module.exports.cancel = async (req, res) => {
  try {
    if (!/^[a-f\d]{24}$/i.test(req.params.orderId || "")) return res.redirect("/orders");
    const order = await Order.findById(req.params.orderId);
    const guestId = req.cookies.guestId || req.cookies.customerId || "";
    const isAccountOwner = req.user && order?.customer_id === String(req.user._id);
    const isGuestOwner = order && (order.guest_id === guestId || order.customer_id === guestId);
    const isVerifiedLookup = order && req.signedCookies.orderAccess === String(order._id);
    if (!order || (!isAccountOwner && !isGuestOwner && !isVerifiedLookup)) {
      req.flash("error", "Bạn không có quyền hủy đơn hàng này.");
      return res.redirect("/orders");
    }
    if (order.status !== "placed") {
      req.flash("error", "Chỉ có thể hủy đơn hàng chưa được xác nhận.");
      return res.redirect(`/orders/${order._id}`);
    }
    const selectedReason = String(req.body.cancelReason || "").trim();
    const reasonDetail = String(req.body.cancelReasonDetail || "").trim().slice(0, 500);
    if (!cancellationReasons.includes(selectedReason) || (selectedReason === "Lý do khác" && !reasonDetail)) {
      req.flash("error", "Vui lòng chọn lý do hủy đơn hợp lệ.");
      return res.redirect(`/orders/${order._id}`);
    }
    const reason = selectedReason === "Lý do khác"
      ? `${selectedReason}: ${reasonDetail}`
      : selectedReason;

    const cancelled = await Order.findOneAndUpdate(
      { _id: order._id, status: "placed" },
      { $set: { status: "cancelled" }, $push: { statusHistory: {
        status: "cancelled",
        changedBy: String(order.customer_id || order.guest_id || "customer"),
        note: `Khách hàng hủy đơn hàng. Lý do: ${reason}.`
      } } },
      { new: true }
    );
    if (!cancelled) {
      req.flash("error", "Đơn hàng vừa được cập nhật, bạn không thể hủy đơn này.");
      return res.redirect(`/orders/${order._id}`);
    }
    await restoreOrderStock(order.products);
    req.flash("success", "Đã hủy đơn hàng và hoàn lại tồn kho.");
    return res.redirect(`/orders/${order._id}`);
  } catch (error) {
    console.log("Lỗi hủy đơn hàng:", error);
    req.flash("error", "Không thể hủy đơn hàng lúc này.");
    return res.redirect("/orders");
  }
};
const validStatuses = Object.keys(statusLabels);

const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// POST /orders/:orderId/reorder: thêm các mặt hàng còn bán được vào giỏ hiện tại.
module.exports.reorder = async (req, res) => {
  try {
    if (!/^[a-f\d]{24}$/i.test(req.params.orderId || "")) return res.redirect("/orders");
    const order = await Order.findById(req.params.orderId).lean();
    const guestId = req.cookies.guestId || req.cookies.customerId || "";
    const isAccountOwner = req.user && order?.customer_id === String(req.user._id);
    const isGuestOwner = order && (order.guest_id === guestId || order.customer_id === guestId);
    const isVerifiedLookup = order && req.signedCookies.orderAccess === String(order._id);
    if (!order || (!isAccountOwner && !isGuestOwner && !isVerifiedLookup)) {
      req.flash("error", "Bạn không có quyền mua lại đơn hàng này.");
      return res.redirect("/orders");
    }

    const cart = req.user
      ? await Cart.findOne({ user_id: String(req.user._id) })
      : await Cart.findById(req.cookies.cartId);
    if (!cart) {
      req.flash("error", "Không tìm thấy giỏ hàng. Vui lòng tải lại trang rồi thử lại.");
      return res.redirect("/orders");
    }

    let added = 0;
    let unavailable = 0;
    for (const item of order.products || []) {
      const product = await Product.findOne({ _id: item.product_id, deleted: false, status: "active" }).lean();
      if (!product) { unavailable++; continue; }
      const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;
      const variant = hasVariants
        ? product.variants.find(v => (v.size || "") === (item.size || "") && (v.color || "") === (item.color || ""))
        : null;
      if (hasVariants && !variant) { unavailable++; continue; }
      const stock = Math.max(0, Number(variant ? variant.stock : product.stock) || 0);
      if (!stock) { unavailable++; continue; }

      const matchIndex = cart.products.findIndex(line => String(line.product_id) === String(item.product_id) &&
        (line.size || "") === (item.size || "") && (line.color || "") === (item.color || ""));
      const currentQuantity = matchIndex >= 0 ? Number(cart.products[matchIndex].quantity) || 0 : 0;
      const nextQuantity = Math.min(stock, currentQuantity + (Number(item.quantity) || 1));
      if (matchIndex >= 0) cart.products[matchIndex].quantity = nextQuantity;
      else cart.products.push({ product_id: String(item.product_id), quantity: nextQuantity, size: item.size || "", color: item.color || "" });
      added++;
    }

    await cart.save();
    req.flash(added ? "success" : "error", added
      ? `Đã thêm ${added} sản phẩm vào giỏ hàng${unavailable ? `; ${unavailable} sản phẩm hiện không còn hàng` : ""}.`
      : "Các sản phẩm trong đơn hiện không còn bán hoặc đã hết hàng.");
    return res.redirect(added ? "/cart" : `/orders/${order._id}`);
  } catch (error) {
    console.log("Lỗi mua lại đơn hàng:", error);
    req.flash("error", "Không thể mua lại đơn hàng lúc này.");
    return res.redirect("/orders");
  }
};

// GET /orders: hiển thị các đơn khách đã đặt trên trình duyệt hiện tại, có thể tìm/lọc trạng thái.
module.exports.index = async (req, res) => {
  const guestId = req.cookies.guestId || req.cookies.customerId || "";
  const status = validStatuses.includes(req.query.status) ? req.query.status : "";
  const keyword = String(req.query.q || "").trim();
  const accessibleOrders = [];
  if (req.user) accessibleOrders.push({ customer_id: String(req.user._id) });
  if (guestId) accessibleOrders.push({ guest_id: guestId }, { customer_id: guestId });
  if (/^[a-f\d]{24}$/i.test(req.signedCookies.orderAccess || "")) {
    accessibleOrders.push({ _id: req.signedCookies.orderAccess });
  }
  const find = { $and: [{ $or: accessibleOrders }] };
  if (status) find.status = status;
  if (keyword) {
    const regex = new RegExp(escapeRegex(keyword), "i");
    find.$and.push({ $or: [{ orderNumber: regex }, { "products.title": regex }] });
  }

  const orders = accessibleOrders.length
    ? await Order.find(find).sort({ createdAt: -1 }).lean()
    : [];
  res.render("client/pages/orders/index", {
    pageTitle: "Theo dõi đơn hàng",
    orders,
    statusLabels,
    statuses: validStatuses.map(key => ({ key, title: statusLabels[key] })),
    selectedStatus: status,
    keyword
  });
};

// GET /orders/:orderId: chỉ cho phép khách xem đơn thuộc guest ID hiện tại.
module.exports.detail = async (req, res) => {
  try {
    if (!/^[a-f\d]{24}$/i.test(req.params.orderId || "")) return res.redirect("/orders");
    const order = await Order.findById(req.params.orderId).lean();
    const guestId = req.cookies.guestId || req.cookies.customerId || "";
    const isAccountOwner = req.user && order?.customer_id === String(req.user._id);
    const isGuestOwner = order && (order.guest_id === guestId || order.customer_id === guestId);
    const isVerifiedLookup = req.signedCookies.orderAccess === String(order?._id || "");
    if (!order || (!isAccountOwner && !isGuestOwner && !isVerifiedLookup)) return res.redirect("/orders");
    res.render("client/pages/orders/detail", {
      pageTitle: `Đơn hàng ${order.orderNumber}`,
      order,
      statusLabels
    });
  } catch (error) {
    console.log("Lỗi xem chi tiết đơn hàng:", error);
    res.redirect("/orders");
  }
};

// POST /orders/lookup: cho phép khách tra cứu đơn bằng mã đơn và số điện thoại nhận hàng.
module.exports.lookup = async (req, res) => {
  const orderNumber = String(req.body.orderNumber || "").trim().toUpperCase();
  const phone = String(req.body.phone || "").replace(/\D/g, "");
  if (!orderNumber || !phone) {
    req.flash("error", "Vui lòng nhập mã đơn hàng và số điện thoại nhận hàng.");
    return res.redirect("/orders");
  }

  try {
    const order = await Order.findOne({ orderNumber }).lean();
    const savedPhone = String(order?.customer?.phone || "").replace(/\D/g, "");
    if (!order || savedPhone !== phone) {
      req.flash("error", "Không tìm thấy đơn hàng phù hợp với mã đơn và số điện thoại.");
      return res.redirect("/orders");
    }

    res.cookie("orderAccess", String(order._id), {
      signed: true,
      maxAge: 1000 * 60 * 60 * 24 * 30,
      httpOnly: true,
      sameSite: "lax"
    });
    return res.redirect(`/orders/${order._id}`);
  } catch (error) {
    console.log("Lỗi tra cứu đơn hàng:", error);
    req.flash("error", "Không thể tra cứu đơn hàng lúc này.");
    return res.redirect("/orders");
  }
};

// POST /orders/:orderId/confirm-received: khách xác nhận đã nhận đơn đang giao.
module.exports.confirmReceived = async (req, res) => {
  try {
    if (!/^[a-f\d]{24}$/i.test(req.params.orderId || "")) return res.redirect("/orders");
    const order = await Order.findById(req.params.orderId);
    const guestId = req.cookies.guestId || req.cookies.customerId || "";
    const isAccountOwner = req.user && order?.customer_id === String(req.user._id);
    const isGuestOwner = order && (order.guest_id === guestId || order.customer_id === guestId);
    const isVerifiedLookup = order && req.signedCookies.orderAccess === String(order._id);

    if (!order || (!isAccountOwner && !isGuestOwner && !isVerifiedLookup)) {
      req.flash("error", "Bạn không có quyền cập nhật đơn hàng này.");
      return res.redirect("/orders");
    }
    if (order.status !== "shipping") {
      req.flash("error", "Chỉ có thể xác nhận đã nhận khi đơn hàng đang được giao.");
      return res.redirect(`/orders/${order._id}`);
    }

    order.status = "delivered";
    order.statusHistory.push({
      status: "delivered",
      changedBy: String(order.customer_id || order.guest_id || "customer"),
      note: "Khách hàng xác nhận đã nhận đơn."
    });
    // Xác nhận nhận hàng hoàn tất thanh toán với COD; VNPay giữ nguyên trạng thái đã trả.
    if (order.paymentStatus !== "paid") {
      order.paymentStatus = "paid";
      order.paidAt = new Date();
    }
    await order.save();
    req.flash("success", "Đã xác nhận nhận hàng. Đơn hàng được đánh dấu đã thanh toán.");
    return res.redirect(`/orders/${order._id}`);
  } catch (error) {
    console.log("Lỗi xác nhận đã nhận đơn hàng:", error);
    req.flash("error", "Không thể xác nhận đã nhận đơn hàng lúc này.");
    return res.redirect("/orders");
  }
};
