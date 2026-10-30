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
          let itemPriceOld = processedProduct.price;
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
              itemPriceOld = basePrice;
            }
          }

          // 3. Gán thông tin vào item để bên Pug hiển thị
          item.productInfo = processedProduct;
          item.stock = selectedVariant ? Number(selectedVariant.stock) || 0 : Number(product.stock) || 0;
          item.price = Number(itemPrice) || 0; // Đảm bảo luôn là số
          item.priceOld = Number(itemPriceOld) > item.price ? Number(itemPriceOld) : 0;
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


// POST /cart/update
// Cập nhật số lượng sản phẩm trong giỏ hàng
// Trả về số lượng, thành tiền và tổng tiền mới
module.exports.updatePost = async (req, res) => {
  try {
    // 1. Lấy giỏ hàng của người dùng
    const cartId = req.cookies.cartId;

    const cart = await Cart.findById(cartId);

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy giỏ hàng."
      });
    }

    // 2. Lấy thông tin từ request gửi lên
    const productId = String(req.body.productId || "");
    const size = String(req.body.size || "");
    const color = String(req.body.color || "");

    const requestedQuantity = parseInt(req.body.quantity, 10) || 1;

    // 3. Tìm sản phẩm trong database
    const product = await Product.findOne({
      _id: productId,
      deleted: false,
      status: "active"
    }).lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Sản phẩm không còn khả dụng."
      });
    }

    // 4. Kiểm tra sản phẩm có phân loại hay không
    const hasVariants = productHasVariants(product);

    // 5. Tìm sản phẩm tương ứng trong giỏ hàng
    let productIndex = -1;

    for (let i = 0; i < cart.products.length; i++) {
      const cartItem = cart.products[i];

      const isSameProduct =
        String(cartItem.product_id) === productId;

      const isSameVariant =
        (cartItem.size || "") === size &&
        (cartItem.color || "") === color;

      if (isSameProduct && (!hasVariants || isSameVariant)) {
        productIndex = i;
        break;
      }
    }

    // Nếu không tìm thấy đúng phân loại,
    // tìm lại theo productId để hỗ trợ dữ liệu giỏ hàng cũ.
    if (productIndex === -1) {
      productIndex = cart.products.findIndex((cartItem) => {
        return String(cartItem.product_id) === productId;
      });
    }

    if (productIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm trong giỏ."
      });
    }

    // 6. Lấy thông tin phân loại sản phẩm
    let variant = null;

    if (hasVariants) {
      variant = (product.variants || []).find((item) => {
        return (
          (item.size || "") === size &&
          (item.color || "") === color
        );
      });
    }

    // 7. Xác định số lượng tồn kho
    let stock = 0;

    if (variant) {
      stock = Number(variant.stock) || 0;
    } else {
      stock = Number(product.stock) || 0;
    }

    if (stock < 1) {
      return res.status(400).json({
        success: false,
        message: "Sản phẩm đã hết hàng."
      });
    }

    // 8. Giới hạn số lượng theo tồn kho
    const quantity = Math.max(
      1,
      Math.min(requestedQuantity, stock)
    );

    // 9. Cập nhật số lượng vào giỏ hàng
    cart.products[productIndex].quantity = quantity;

    await cart.save();

    // 10. Tính đơn giá của sản phẩm vừa cập nhật
    const basePrice = Number(
      variant ? variant.price : product.price
    ) || 0;

    const discountPercentage =
      Number(product.discountPercentage) || 0;

    let price = basePrice;

    // Ưu tiên sử dụng giá mới của phân loại nếu có
    if (variant && Number(variant.priceNew) > 0) {
      price = Number(variant.priceNew);
    } else if (discountPercentage > 0) {
      const discountedPrice =
        basePrice * (100 - discountPercentage) / 100;

      // Làm tròn giá về hàng chục nghìn
      price = Math.round(discountedPrice / 10000) * 10000;
    }

    // Thành tiền của sản phẩm vừa cập nhật
    const itemTotal = price * quantity;

    // 11. Lấy tất cả sản phẩm trong giỏ hàng từ database
    const productIds = cart.products.map((item) => {
      return item.product_id;
    });

    const products = await Product.find({
      _id: { $in: productIds },
      deleted: false,
      status: "active"
    }).lean();

    // 12. Tạo Map để tra cứu sản phẩm theo ID
    const productMap = new Map();

    for (const item of products) {
      productMap.set(String(item._id), item);
    }

    // 13. Tính tổng tiền của toàn bộ giỏ hàng
    let totalAll = 0;

    for (const cartItem of cart.products) {
      // Tìm thông tin sản phẩm tương ứng
      const currentProduct = productMap.get(
        String(cartItem.product_id)
      );

      if (!currentProduct) {
        continue;
      }

      // Kiểm tra và lấy phân loại tương ứng
      const currentHasVariants =
        productHasVariants(currentProduct);

      let currentVariant = null;

      if (currentHasVariants) {
        currentVariant = (currentProduct.variants || []).find((item) => {
          return (
            (item.size || "") === (cartItem.size || "") &&
            (item.color || "") === (cartItem.color || "")
          );
        });
      }

      // Lấy giá gốc
      const currentBasePrice = Number(
        currentVariant
          ? currentVariant.price
          : currentProduct.price
      ) || 0;

      // Lấy phần trăm giảm giá
      const currentDiscount =
        Number(currentProduct.discountPercentage) || 0;

      // Tính đơn giá sau giảm
      let currentUnitPrice = currentBasePrice;

      if (
        currentVariant &&
        Number(currentVariant.priceNew) > 0
      ) {
        currentUnitPrice = Number(currentVariant.priceNew);
      } else if (currentDiscount > 0) {
        const discountedPrice =
          currentBasePrice * (100 - currentDiscount) / 100;

        currentUnitPrice =
          Math.round(discountedPrice / 10000) * 10000;
      }

      // Cộng thành tiền của từng sản phẩm vào tổng tiền
      const currentQuantity = Number(cartItem.quantity) || 0;

      totalAll += currentUnitPrice * currentQuantity;
    }

    // 14. Tính tổng số lượng sản phẩm trong giỏ
    const totalQuantity = cart.products.reduce(
      (total, item) => {
        return total + (Number(item.quantity) || 0);
      },
      0
    );

    // 15. Trả kết quả về frontend
    return res.json({
      success: true,
      quantity,
      stock,
      itemTotal,
      totalAll,
      totalQuantity
    });

  } catch (error) {
    console.log("Lỗi cập nhật số lượng giỏ hàng:", error);

    return res.status(500).json({
      success: false,
      message: "Không thể cập nhật giỏ hàng."
    });
  }
};


// Hàm kiểm tra sản phẩm có sử dụng phân loại hay không
function productHasVariants(product) {
  const enabled =
    product?.hasVariants === true ||
    product?.hasVariants === "true" ||
    product?.hasVariants === 1;

  const hasVariantList =
    Array.isArray(product?.variants) &&
    product.variants.length > 0;

  return enabled && hasVariantList;
}


//GET /cart/delete/:productId
module.exports.delete = async (req, res) => {
  const productId = req.params.productId;
  const cartId = req.cookies.cartId;
  await Cart.updateOne(
    {
      _id: cartId
    },
    {
      "$pull": {products: {"product_id": productId}}
    }
  );
  req.flash("success", "Đã xóa sản phẩm khỏi giỏ hàng!");
  res.redirect(req.get("Referer") || "/cart");
}
