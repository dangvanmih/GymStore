module.exports.calculatePriceNew = (price, discountPercentage) => {
  if (discountPercentage <= 0) return price;
  const exactPrice = price * (1 - discountPercentage / 100);
  return Math.round(exactPrice / 10000) * 10000;
};