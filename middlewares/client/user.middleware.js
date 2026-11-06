const User = require("../../models/user.model");

module.exports.currentUser = async (req, res, next) => {
  try {
    const token = req.cookies.tokenUser;
    const user = token ? await User.findOne({ tokenUser: token, status: "active", deleted: false }).select("_id firstName lastName email favoriteIds").lean() : null;
    req.user = user || null;
    res.locals.currentUser = req.user;
    next();
  } catch (error) {
    next(error);
  }
};
