const crypto = require("crypto");
const Address = require("../../models/address.model");
const Cart = require("../../models/cart.model");
const Order = require("../../models/order.model");
const Product = require("../../models/product.model");

const getGuestId = (req, res) => {
  let guestId = req.cookies.guestId || req.cookies.customerId;
  if (!/^[a-f\d-]{36}$/i.test(guestId || "")) {
    guestId = crypto.randomUUID();
  }
  if (req.cookies.guestId !== guestId) {
    res.cookie("guestId", guestId, {
      maxAge: 1000 * 60 * 60 * 24 * 365,
      httpOnly: true,
      sameSite: "lax"
    });
  }
  return guestId;
};

const getUnitPrice = (product, variant) => {
  const basePrice = Number(variant ? variant.price : product.price) || 0;
  const savedPrice = Number(variant ? variant.priceNew : 0) || 0;
  if (savedPrice > 0) return savedPrice;
  const discount = Number(product.discountPercentage) || 0;
  return discount > 0
    ? Math.round((basePrice * (100 - discount) / 100) / 10000) * 10000
    : basePrice;
};

const getCartLines = async cartId => {
  if (!/^[a-f\d]{24}$/i.test(cartId || "")) return { cart: null, lines: [], subtotal: 0 };
  const cart = await Cart.findById(cartId).lean();
  if (!cart || !cart.products.length) return { cart, lines: [], subtotal: 0, invalidCount: 0 };

  const lines = [];
  let invalidCount = 0;
  for (const cartItem of cart.products) {
    const product = await Product.findOne({
      _id: cartItem.product_id,
      status: "active",
      deleted: false
    }).lean();
    if (!product) {
      invalidCount++;
      continue;
    }

    const variant = product.hasVariants
      ? (product.variants || []).find(item =>
        (item.size || "") === (cartItem.size || "") &&
        (item.color || "") === (cartItem.color || ""))
      : null;
    if (product.hasVariants && !variant) {
      invalidCount++;
      continue;
    }

    const price = getUnitPrice(product, variant);
    const quantity = Number(cartItem.quantity) || 1;
    lines.push({
      product_id: String(product._id),
      title: product.title,
      thumbnail: product.thumbnail,
      size: cartItem.size || "",
      color: cartItem.color || "",
      quantity,
      originalPrice: Number(variant ? variant.price : product.price) || 0,
      price,
      discountPercentage: Number(product.discountPercentage) || 0,
      total: price * quantity,
      stock: Number(variant ? variant.stock : product.stock) || 0,
      hasVariant: Boolean(product.hasVariants),
      variant: variant ? { size: variant.size, color: variant.color } : null
    });
  }

  const subtotal = lines.reduce((sum, line) => sum + line.originalPrice * line.quantity, 0);
  const discountTotal = lines.reduce((sum, line) => sum + Math.max(0, line.originalPrice - line.price) * line.quantity, 0);
  return { cart, lines, subtotal, discountTotal, invalidCount };
};

// GET /checkout: tải giỏ hàng, tính lại giá từ database và hiển thị các địa chỉ đã lưu.
module.exports.index = async (req, res) => {
  try {
    const guestId = getGuestId(req, res);
    const { lines, subtotal, discountTotal, invalidCount } = await getCartLines(req.cookies.cartId);
    if (!lines.length || invalidCount) {
      req.flash("error", invalidCount ? "Có sản phẩm trong giỏ không còn khả dụng. Vui lòng kiểm tra lại giỏ hàng." : "Giỏ hàng đang trống.");
      return res.redirect("/cart");
    }
    const addresses = await Address.find({ $or: [{ owner_id: guestId }, { customer_id: guestId }] }).sort({ isDefault: -1, createdAt: -1 }).lean();
    res.render("client/pages/checkout/index", {
      pageTitle: "Thanh toán",
      lines,
      subtotal,
      discountTotal,
      addresses,
      defaultAddressId: String((addresses.find(address => address.isDefault) || addresses[0] || {})._id || "")
    });
  } catch (error) {
    console.log("Lỗi trang thanh toán:", error);
    req.flash("error", "Không thể tải trang thanh toán.");
    res.redirect("/cart");
  }
};

// POST /checkout/addresses: kiểm tra và lưu một địa chỉ nhận hàng mới cho khách hiện tại.
module.exports.addAddress = async (req, res) => {
  try {
    const guestId = getGuestId(req, res);
    const fields = ["recipientName", "phone", "province", "district", "ward", "streetAddress"];
    const values = Object.fromEntries(fields.map(field => [field, String(req.body[field] || "").trim()]));
    if (fields.some(field => !values[field])) {
      req.flash("error", "Vui lòng điền đầy đủ thông tin địa chỉ.");
      return res.redirect("/checkout");
    }

    const ownerFilter = { $or: [{ owner_id: guestId }, { customer_id: guestId }] };
    const existingCount = await Address.countDocuments(ownerFilter);
    const address = new Address({
      ...values,
      email: String(req.body.email || "").trim(),
      owner_id: guestId,
      label: String(req.body.label || "Nhà riêng").trim(),
      isDefault: existingCount === 0 || req.body.isDefault === "on"
    });
    if (address.isDefault) await Address.updateMany(ownerFilter, { $set: { isDefault: false } });
    await address.save();
    req.flash("success", "Đã lưu địa chỉ nhận hàng.");
    res.redirect("/checkout");
  } catch (error) {
    console.log("Lỗi lưu địa chỉ nhận hàng:", error);
    req.flash("error", "Không thể lưu địa chỉ. Vui lòng thử lại.");
    res.redirect("/checkout");
  }
};

// POST /checkout/addresses/:addressId/delete: xóa địa chỉ thuộc khách hiện tại;
// nếu xóa địa chỉ mặc định thì chọn một địa chỉ còn lại làm mặc định.
module.exports.deleteAddress = async (req, res) => {
  try {
    const guestId = getGuestId(req, res);
    const address = await Address.findOneAndDelete({ _id: req.params.addressId, $or: [{ owner_id: guestId }, { customer_id: guestId }] });
    if (address?.isDefault) {
      const nextAddress = await Address.findOne({ $or: [{ owner_id: guestId }, { customer_id: guestId }] }).sort({ createdAt: 1 });
      if (nextAddress) {
        nextAddress.isDefault = true;
        await nextAddress.save();
      }
    }
    req.flash("success", "Đã xóa địa chỉ.");
  } catch (error) {
    req.flash("error", "Không thể xóa địa chỉ.");
  }
  res.redirect("/checkout");
};

// POST /checkout/place-order: xác thực địa chỉ và giỏ, tính giá phía server,
// giữ tồn kho, tạo đơn COD chờ xác nhận rồi làm trống giỏ hàng.
module.exports.placeOrder = async (req, res) => {
  const guestId = getGuestId(req, res);
  let reserved = [];
  let savedOrder = null;
  try {
    const address = await Address.findOne({ _id: req.body.addressId, $or: [{ owner_id: guestId }, { customer_id: guestId }] }).lean();
    if (!address) {
      req.flash("error", "Vui lòng chọn địa chỉ nhận hàng hợp lệ.");
      return res.redirect("/checkout");
    }

    const { cart, lines, subtotal, discountTotal, invalidCount } = await getCartLines(req.cookies.cartId);
    if (!cart || !lines.length || invalidCount) {
      req.flash("error", "Giỏ hàng đang trống hoặc sản phẩm không còn khả dụng.");
      return res.redirect("/cart");
    }

    for (const line of lines) {
      if (line.stock < line.quantity) throw new Error(`Sản phẩm ${line.title} không đủ tồn kho.`);
      const filter = line.hasVariant
        ? {
          _id: line.product_id,
          variants: { $elemMatch: { size: line.variant.size, color: line.variant.color, stock: { $gte: line.quantity } } }
        }
        : { _id: line.product_id, stock: { $gte: line.quantity } };
      const update = line.hasVariant
        ? { $inc: { "variants.$.stock": -line.quantity } }
        : { $inc: { stock: -line.quantity } };
      const updatedProduct = await Product.findOneAndUpdate(filter, update, { new: true }).select("_id");
      if (!updatedProduct) throw new Error(`Sản phẩm ${line.title} vừa hết hàng hoặc không đủ tồn kho.`);
      reserved.push(line);
    }

    const fullAddress = [address.streetAddress, address.ward, address.district, address.province].join(", ");
    const order = new Order({
      orderNumber: `GS${Date.now()}${crypto.randomBytes(2).toString("hex").toUpperCase()}`,
      guest_id: guestId,
      cart_id: String(cart._id),
      customer: { fullName: address.recipientName, phone: address.phone, email: address.email },
      shippingAddress: {
        label: address.label,
        province: address.province,
        district: address.district,
        ward: address.ward,
        streetAddress: address.streetAddress,
        fullAddress
      },
      note: String(req.body.note || "").trim(),
      products: lines.map(({ stock, hasVariant, variant, ...item }) => item),
      subtotal,
      discountTotal,
      shippingFee: 0,
      total: subtotal - discountTotal,
      status: "placed",
      paymentMethod: "cod",
      paymentStatus: "unpaid",
      statusHistory: [{ status: "placed", note: "Khách hàng gửi yêu cầu đặt hàng." }]
    });
    await order.save();
    savedOrder = order;

    await Cart.updateOne({ _id: cart._id }, { $set: { products: [] } });
    return res.redirect(`/orders/${order._id}/complete`);
  } catch (error) {
    if (savedOrder) return res.redirect(`/orders/${savedOrder._id}/complete`);
    for (const line of reserved.reverse()) {
      const filter = line.hasVariant
        ? { _id: line.product_id, variants: { $elemMatch: { size: line.variant.size, color: line.variant.color } } }
        : { _id: line.product_id };
      const update = line.hasVariant
        ? { $inc: { "variants.$.stock": line.quantity } }
        : { $inc: { stock: line.quantity } };
      await Product.updateOne(filter, update).catch(() => {});
    }
    console.log("Lỗi tạo đơn hàng:", error);
    req.flash("error", error.message || "Không thể tạo đơn hàng. Vui lòng thử lại.");
    res.redirect("/checkout");
  }
};

// GET /orders/:orderId/complete: chỉ khách sở hữu đơn mới xem được trang đặt hàng thành công.
module.exports.complete = async (req, res) => {
  try {
    const guestId = getGuestId(req, res);
    const order = await Order.findOne({
      _id: req.params.orderId,
      $or: [{ guest_id: guestId }, { customer_id: guestId }]
    }).lean();
    if (!order) return res.redirect("/");
    res.render("client/pages/checkout/complete", { pageTitle: "Đặt hàng thành công", order });
  } catch (error) {
    res.redirect("/");
  }
};
