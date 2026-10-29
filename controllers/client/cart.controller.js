const Cart = require("../../models/cart.model");
const Product = require("../../models/product.model");
const { calculateProductPrice } = require("../../helpers/productPrice");

// GET /cart/
module.exports.index = async (req, res) => {
  try {
    const cartId = req.cookies.cartId;

    // Lấy giỏ hàng và dùng .lean() để dễ gán thêm thuộc tính
    let cart = await Cart.findOne({
      _id: cartId
    }).lean();

    if (!cart) cart = { products: [] };

    let totalAll = 0;

    if (cart.products && cart.products.length > 0) {
      for (const item of cart.products) {
        const productId = item.product_id;
        const product = await Product.findOne({
          _id: productId,
          deleted: false,
          status: "active"
        }).lean();

        if (product) {
          // 1. Tính toán giá chuẩn bằng helper
          const processedProduct = calculateProductPrice(product);
          let itemPrice = processedProduct.priceNew;
          let selectedVariant = null;

          // 2. Nếu sản phẩm có phân loại, tìm đúng giá của size và màu người dùng đã chọn trong giỏ hàng
          if (productHasVariants(processedProduct) && processedProduct.variants && processedProduct.variants.length > 0) {
            selectedVariant = processedProduct.variants.find(v =>
              (v.size || "") === (item.size || "") &&
              (v.color || "") === (item.color || "")
            );
            if (selectedVariant) {
              const discount = Number(processedProduct.discountPercentage) || 0;
              const basePrice = Number(selectedVariant.price) || Number(processedProduct.price) || 0;
              itemPrice = Number(selectedVariant.priceNew) || (discount > 0
                ? Math.round((basePrice * (100 - discount) / 100) / 10000) * 10000
                : basePrice);
            }
          }

          // 3. Gán thông tin vào item để bên Pug hiển thị
          item.productInfo = processedProduct;
          item.stock = selectedVariant ? Number(selectedVariant.stock) || 0 : Number(product.stock) || 0;
          item.price = Number(itemPrice) || 0; // Đảm bảo luôn là số
          item.totalPrice = item.price * (Number(item.quantity) || 1);

          totalAll += item.totalPrice;
        }
        else item.unavailable = true;
      }
    }

    // Gắn tổng tiền vào object cartDetail để truyền ra view
    cart.totalAll = totalAll;

    res.render("client/pages/cart/index", {
      pageTitle: "Giỏ hàng của bạn",
      cartDetail: cart
    });
  } catch (error) {
    console.log("Lỗi trang giỏ hàng:", error);
    res.redirect("/");
  }
};

// POST /cart/add/:productId
module.exports.addPost = async (req, res) => {
  const cartId = req.cookies.cartId;
  const productId = req.params.productId;
  const quantity = Math.max(1, parseInt(req.body.quantity, 10) || 1);

  const cart = await Cart.findOne({
    _id: cartId,
  })
  if (!cart) return res.redirect(req.get("Referer") || "/products");

  const product = await Product.findOne({ _id: productId, deleted: false, status: "active" }).lean();
  if (!product) {
    req.flash("error", "Sản phẩm không tồn tại hoặc đã ngừng bán!");
    return res.redirect(req.get("Referer") || "/products");
  }

  const size = String(req.body.size || "").trim();
  const color = String(req.body.color || "").trim();
  let variant = null;

  //Kiểm tra sản phẩm có biến thể không
  if (productHasVariants(product) && Array.isArray(product.variants) && product.variants.length) {
    variant = product.variants.find(v => (v.size || "") === size && (v.color || "") === color);
    if (!variant) {
      req.flash("error", "Vui lòng chọn phân loại sản phẩm hợp lệ!");
      return res.redirect(req.get("Referer") || "/products");
    }
  }
  //Kiểm tra sản phẩm đã có trong giỏ hàng chưa
  const matchSelection = item => String(item.product_id) === String(productId) &&
    (item.size || "") === (size || "") && (item.color || "") === (color || "");
  const existingIndex = cart.products.findIndex(matchSelection);
  const existProductInCart = existingIndex >= 0 ? cart.products[existingIndex] : null;

  //Kiểm tra tồn kho và tính số lượng mới
  const availableStock = Number(variant ? variant.stock : product.stock) || 0;
  if (availableStock < 1) {
    req.flash("error", "Phân loại sản phẩm này hiện đã hết hàng!");
    return res.redirect(req.get("Referer") || "/products");
  }
  const newQuantity = Math.min(availableStock, quantity + (existProductInCart?.quantity || 0));

  //Nếu sản phẩm đã có trong giỏ hàng thì cập nhật  
  if (existProductInCart) {
    await Cart.updateOne(
      {
        _id: cartId
      },
      {
        $set: {
          [`products.${existingIndex}.quantity`]: newQuantity,
          [`products.${existingIndex}.size`]: size,
          [`products.${existingIndex}.color`]: color
        }
      }
    );
  }
  //Nếu chưa có trong giỏ thì thêm phần tử mới
  else {
    const objectCart = {
      product_id: productId,
      quantity: newQuantity,
      size,
      color
    }

    await Cart.updateOne(
      {
        _id: cartId
      },
      {
        $push: { products: objectCart }
      }
    );
  }

  req.flash("success", "Thêm sản phẩm vào giỏ hàng thành công!");
  res.redirect(req.get("Referer"));
}

// POST /cart/update: cập nhật số lượng và trả tổng tiền mới cho trang giỏ hàng
module.exports.updatePost = async (req, res) => {
  try {
    const cart = await Cart.findById(req.cookies.cartId);
    if (!cart) return res.status(404).json({ success: false, message: "Không tìm thấy giỏ hàng." });

    const productId = String(req.body.productId || "");
    const size = String(req.body.size || "");
    const color = String(req.body.color || "");
    const product = await Product.findOne({ _id: productId, deleted: false, status: "active" }).lean();
    if (!product) return res.status(404).json({ success: false, message: "Sản phẩm không còn khả dụng." });

    const hasVariants = productHasVariants(product);
    let index = cart.products.findIndex(item => String(item.product_id) === productId && (
      !hasVariants || ((item.size || "") === size && (item.color || "") === color)
    ));
    // Hỗ trợ mục giỏ cũ chưa lưu size/màu hoặc sản phẩm vừa được đổi cấu hình phân loại.
    if (index < 0) index = cart.products.findIndex(item => String(item.product_id) === productId);
    if (index < 0) return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm trong giỏ." });
    const variant = hasVariants
      ? (product.variants || []).find(v => (v.size || "") === size && (v.color || "") === color)
      : null;

    const stock = Number(variant ? variant.stock : product.stock) || 0;
    if (stock < 1) return res.status(400).json({ success: false, message: "Sản phẩm đã hết hàng." });
    const quantity = Math.max(1, Math.min(stock, parseInt(req.body.quantity, 10) || 1));
    cart.products[index].quantity = quantity;
    await cart.save();

    const basePrice = Number(variant ? variant.price : product.price) || 0;
    const discount = Number(product.discountPercentage) || 0;
    const price = Number(variant?.priceNew) || (discount > 0
      ? Math.round((basePrice * (100 - discount) / 100) / 10000) * 10000
      : basePrice);
    const products = await Product.find({
      _id: { $in: cart.products.map(item => item.product_id) },
      deleted: false,
      status: "active"
    }).lean();
    const productById = new Map(products.map(item => [String(item._id), item]));
    let totalAll = 0;
    for (const item of cart.products) {
      const itemProduct = productById.get(String(item.product_id));
      if (!itemProduct) continue;
      const itemVariant = productHasVariants(itemProduct)
        ? (itemProduct.variants || []).find(v => (v.size || "") === (item.size || "") && (v.color || "") === (item.color || ""))
        : null;
      const itemBasePrice = Number(itemVariant ? itemVariant.price : itemProduct.price) || 0;
      const itemDiscount = Number(itemProduct.discountPercentage) || 0;
      const itemUnitPrice = Number(itemVariant?.priceNew) || (itemDiscount > 0
        ? Math.round((itemBasePrice * (100 - itemDiscount) / 100) / 10000) * 10000
        : itemBasePrice);
      totalAll += itemUnitPrice * (Number(item.quantity) || 0);
    }

    res.json({
      success: true,
      quantity,
      stock,
      itemTotal: price * quantity,
      totalAll,
      totalQuantity: cart.products.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
    });
  } catch (error) {
    console.log("Lỗi cập nhật số lượng giỏ hàng:", error);
    res.status(500).json({ success: false, message: "Không thể cập nhật giỏ hàng." });
  }
};

function productHasVariants(product) {
  const enabled = product?.hasVariants === true || product?.hasVariants === "true" || product?.hasVariants === 1;
  return enabled && Array.isArray(product?.variants) && product.variants.length > 0;
}
