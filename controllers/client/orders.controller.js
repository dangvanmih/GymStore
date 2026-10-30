const Order = require("../../models/order.model");

const statusLabels = {
  placed: "Chờ xác nhận",
  preparing: "Đang chuẩn bị",
  shipping: "Đang giao hàng",
  delivered: "Đã giao hàng"
};
const validStatuses = Object.keys(statusLabels);

const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// GET /orders: hiển thị các đơn khách đã đặt trên trình duyệt hiện tại, có thể tìm/lọc trạng thái.
module.exports.index = async (req, res) => {
  const guestId = req.cookies.guestId || req.cookies.customerId || "";
  const status = validStatuses.includes(req.query.status) ? req.query.status : "";
  const keyword = String(req.query.q || "").trim();
  const accessibleOrders = [];
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
    const isGuestOwner = order && (order.guest_id === guestId || order.customer_id === guestId);
    const isVerifiedLookup = req.signedCookies.orderAccess === String(order?._id || "");
    if (!order || (!isGuestOwner && !isVerifiedLookup)) return res.redirect("/orders");
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
