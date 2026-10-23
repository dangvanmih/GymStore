module.exports.createPost = async (req, res, next) => {
  const hasVariants = req.body.hasVariants === "true" || req.body.hasVariants === true;

  // 1. Tên sản phẩm luôn là bắt buộc cho mọi loại
  if (!req.body.title || req.body.title.trim() === "") {
    req.flash("error", "Vui lòng nhập tên sản phẩm!");
    return res.redirect(req.get("Referer") || `${systemConfig.prefixAdmin}/products/create`);
  }

  // 2. Kiểm tra điều kiện dựa theo loại sản phẩm
  if (!hasVariants) {
    // RƯỜNG HỢP 1: Sản phẩm đơn lẻ (Không có biến thể) ===
    if (req.body.price === "" || req.body.discountPercentage === "" || req.body.stock === "") {
      req.flash("error", "Vui lòng nhập đầy đủ thông tin giá, % giảm giá và tồn kho!");
      return res.redirect(req.get("Referer") || `${systemConfig.prefixAdmin}/products/create`);
    }
  } else {
    //TRƯỜNG HỢP 2: Sản phẩm có phân loại (Size/Màu)
    // Không bắt buộc giá/tồn kho chung, nhưng phải đảm bảo mảng variants có ít nhất 1 dòng hợp lệ
    const hasValidVariant = req.body.variants && Array.isArray(req.body.variants) && 
      req.body.variants.some(item => item.size && item.size.trim() !== "");

    if (!hasValidVariant) {
      req.flash("error", "Vui lòng thêm ít nhất một biến thể (Size/Màu) hợp lệ!");
      return res.redirect(req.get("Referer") || `${systemConfig.prefixAdmin}/products/create`);
    }
  }

  next();
};