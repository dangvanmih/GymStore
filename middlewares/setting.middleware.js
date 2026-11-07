const Setting = require("../models/setting.model");

const defaults = {
  clientLogo: "/client/images/logo.webp",
  copyright: "© 2026 DEGREY VIETNAM",
};

module.exports = async (req, res, next) => {
  try {
    const setting = await Setting.findOne({ key: "general" }).lean();
    res.locals.siteSettings = { ...defaults, ...(setting || {}) };
  } catch (error) {
    console.error("Không thể tải cài đặt website:", error);
    res.locals.siteSettings = defaults;
  }
  next();
};
