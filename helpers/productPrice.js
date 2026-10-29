
// Hàm tính toán giá cho một sản phẩm đơn lẻ
module.exports.calculateProductPrice = (item) => {
  // Chuyển đổi nếu item là Mongoose Document sang Object thường để dễ thao tác
  const product = item._doc ? { ...item._doc } : { ...item };

  let displayPrice = 0;
  let displayPriceNew = 0;
  let discount = Number(product.discountPercentage) || 0;

  // 1. Nếu sản phẩm có phân loại (variants)
  if (product.hasVariants && product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
    const validVariants = product.variants.filter(v => v.priceNew && v.priceNew > 0);

    if (validVariants.length > 0) {
      // Lấy biến thể có giá mới nhỏ nhất
      const minVariant = validVariants.reduce((min, current) => current.priceNew < min.priceNew ? current : min);

      displayPriceNew = minVariant.priceNew;
      displayPrice = minVariant.price || Number(product.price) || 0;
    }
  }

  // 2. Nếu sản phẩm KHÔNG CÓ SIZE (Sản phẩm thường / Giá chung)
  if (displayPriceNew === 0) {
    const basePrice = Number(product.price) || 0;

    // Tính toán giá mới dựa trên % giảm giá chung của sản phẩm
    if (basePrice > 0 && discount > 0) {
      displayPriceNew = Math.round((basePrice * (100 - discount) / 100) / 10000) * 10000;
      displayPrice = basePrice; // Lưu giá gốc để hiện gạch ngang
    } else {
      displayPriceNew = basePrice;
      displayPrice = basePrice; // Không giảm giá thì giá mới = giá gốc
    }
  }

  // Trả về object sản phẩm đã được cập nhật lại giá chuẩn xác
  return {
    ...product,
    priceNew: displayPriceNew,
    price: displayPrice
  };
};

// Hàm hỗ trợ tính cho cả một mảng danh sách sản phẩm
module.exports.calculateProductsPrice = (products) => {
  if (!Array.isArray(products)) return [];
  return products.map(item => module.exports.calculateProductPrice(item));
};