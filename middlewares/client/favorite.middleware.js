module.exports.favoriteIds = (req, res, next) => {
  const favorites = String(req.cookies.favoriteIds || "")
    .split(",")
    .filter(id => /^[a-f\d]{24}$/i.test(id));

  res.locals.favoriteIds = favorites;
  res.locals.favoriteCount = favorites.length;
  next();
};
