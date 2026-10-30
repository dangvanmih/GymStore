const Product = require("../../models/product.model");
const { calculateProductsPrice } = require("../../helpers/productPrice");

const getFavoriteIds = req => String(req.cookies.favoriteIds || "")
  .split(",")
  .filter(id => /^[a-f\d]{24}$/i.test(id));

module.exports.index = async (req, res) => {
  try {
    const favoriteIds = getFavoriteIds(req);
    const products = favoriteIds.length
      ? await Product.find({
        _id: { $in: favoriteIds },
        status: "active",
        deleted: false
      }).lean()
      : [];

    res.render("client/pages/favorites/index", {
      pageTitle: "Sản phẩm yêu thích",
      products: calculateProductsPrice(products)
    });
  } catch (error) {
    console.log("Lỗi trang sản phẩm yêu thích:", error);
    res.redirect("/");
  }
};

module.exports.toggle = async (req, res) => {
  const productId = req.params.productId;
  const returnTo = req.get("Referer") || "/favorites";

  if (!/^[a-f\d]{24}$/i.test(productId)) return res.redirect(returnTo);

  const product = await Product.findOne({
    _id: productId,
    status: "active",
    deleted: false
  }).select("_id").lean();

  if (!product) return res.redirect(returnTo);

  const favoriteIds = getFavoriteIds(req);
  const existingIndex = favoriteIds.indexOf(productId);
  if (existingIndex >= 0) favoriteIds.splice(existingIndex, 1);
  else favoriteIds.push(productId);

  res.cookie("favoriteIds", favoriteIds.join(","), {
    maxAge: 1000 * 60 * 60 * 24 * 30,
    httpOnly: true,
    sameSite: "lax"
  });

  if (req.xhr || req.headers["x-requested-with"] === "XMLHttpRequest") {
    return res.json({
      success: true,
      isFavorite: existingIndex < 0,
      favoriteCount: favoriteIds.length,
      productId
    });
  }

  res.redirect(returnTo);
};
