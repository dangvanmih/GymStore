
const Cart = require("../../models/cart.model");

module.exports.cartId = async (req, res, next) => {
  try {
    let cart = null;

    // Giỏ gắn với tài khoản là nguồn dữ liệu chính khi người dùng đã đăng nhập.
    if (req.user) {
      cart = await Cart.findOne({ user_id: String(req.user._id) });
    }

    // Khách chưa đăng nhập tiếp tục dùng giỏ được nhận diện bằng cookie.
    if (!req.user && req.cookies.cartId) {
      // Tìm giỏ hàng trong MongoDB
      cart = await Cart.findById(req.cookies.cartId);
    }

    // Nếu chưa có giỏ hàng thì tạo giỏ mới.
    if (!cart) {
      cart = new Cart();
      if (req.user) cart.user_id = String(req.user._id);
      await cart.save();

    }

    if (req.user) {
      if (cart.expiresAt) {
        cart.expiresAt = undefined;
        await cart.save();
      }
    } else {
      // Giỏ khách được giữ 24 giờ tính từ lần truy cập gần nhất.
      cart.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await cart.save();
    }

    // Đồng bộ cookie để điều hướng tiếp theo dùng đúng giỏ hàng hiện tại.
    const cartCookieOptions = { httpOnly: true, sameSite: "lax" };
    if (!req.user) cartCookieOptions.maxAge = 1000 * 60 * 60 * 24;
    res.cookie("cartId", String(cart._id), cartCookieOptions);

    // Bước 3: Tính tổng số lượng sản phẩm
    cart.totalQuantity = cart.products.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    // Bước 4: Chia sẻ dữ liệu giỏ hàng cho Pug
    res.locals.miniCart = cart;

    next();

  } catch (error) {
    next(error);
  }
};
