
// Hàm tính toán giá cho một sản phẩm đơn lẻ
module.exports.calculateProductPrice = (item) => {
  // Chuyển đổi nếu item là Mongoose Document sang Object thường để dễ thao tác
  const product = item._doc ? { ...item._doc } : { ...item };

  let displayPrice = 0;
  let displayPriceNew = 0;
  let discount = Number(product.discountPercentage) || 0;

  // 1. Nếu sản phẩm có phân loại (variants)
  if (product.hasVariants && product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
    const pricedVariants = product.variants
      .map(variant => {
        const price = Number(variant.price) || Number(product.price) || 0;
        const priceNew = Number(variant.priceNew) || module.exports.calculatePriceNew(price, discount);
        return { price, priceNew };
      })
      .filter(variant => variant.price > 0);

    if (pricedVariants.length > 0) {
      // Hiển thị mức giá thấp nhất trong các size/màu có giá hợp lệ.
      const minVariant = pricedVariants.reduce((min, current) => current.priceNew < min.priceNew ? current : min);
      displayPriceNew = minVariant.priceNew;
      displayPrice = minVariant.price;
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

module.exports.calculatePriceNew = (price, discountPercentage) => {
  const basePrice = Number(price) || 0;
  const discount = Number(discountPercentage) || 0;
  if (discount <= 0) return basePrice;
  return Math.round((basePrice * (1 - discount / 100)) / 10000) * 10000;
};

// Hàm hỗ trợ tính cho cả một mảng danh sách sản phẩm
module.exports.calculateProductsPrice = (products) => {
  if (!Array.isArray(products)) return [];
  return products.map(item => module.exports.calculateProductPrice(item));
};
