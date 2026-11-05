const Product = require("../models/product.model");

module.exports.restoreOrderStock = async products => {
  for (const item of products) {
    const filter = { _id: item.product_id };
    const update = item.size || item.color
      ? { $inc: { "variants.$.stock": item.quantity } }
      : { $inc: { stock: item.quantity } };

    if (item.size || item.color) {
      filter.variants = { $elemMatch: { size: item.size || "", color: item.color || "" } };
    }

    await Product.findOneAndUpdate(filter, update);
  }
};
