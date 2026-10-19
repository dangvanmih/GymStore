const Account = require("../../models/account.model");
const systemConfig = require("../../configs/system");
module.exports.requireAuth = async (req, res, next) => {
  if (!req.cookies.token) {
    return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
  } else {
    const user = await Account.findOne({
      token: req.cookies.token
    })
    if (!user) {
      return res.redirect(`${systemConfig.prefixAdmin}/auth/login`);
    }
    next();
  }
}