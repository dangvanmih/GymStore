
const Cart = require("../../models/cart.model");

module.exports.cartId = async (req, res, next) => {
  try {
    let cart = null;

    // Bước 1: Kiểm tra Cookie cartId
    if (req.cookies.cartId) {
      // Tìm giỏ hàng trong MongoDB
      cart = await Cart.findById(req.cookies.cartId);
    }

    // Bước 2: Nếu chưa có giỏ hàng hoặc không tìm thấy
    if (!cart) {
      cart = new Cart();
      await cart.save();

      // Tạo Cookie mới
      const expiresTime = 1000 * 60 * 60 * 24;

      res.cookie("cartId", cart.id, {
        expires: new Date(Date.now() + expiresTime),
        httpOnly: true
      });
    }

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
