const Setting = require("../../models/setting.model");
const systemConfig = require("../../configs/system");

const defaults = {
  clientLogo: "/client/images/logo.webp",
  copyright: "© 2026 DEGREY VIETNAM",
};

module.exports.index = async (req, res) => {
  const setting = await Setting.findOne({ key: "general" }).lean();
  res.render("admin/pages/settings/index", {
    pageTitle: "Cài đặt website",
    settings: { ...defaults, ...(setting || {}) },
  });
};

module.exports.update = async (req, res) => {
  try {
    const { copyright, clientLogo } = req.body;
    if (typeof copyright !== "string" || !copyright.trim()) {
      req.flash("error", "Vui lòng nhập dòng bản quyền.");
      return res.redirect(`${systemConfig.prefixAdmin}/settings`);
    }
    await Setting.findOneAndUpdate(
      { key: "general" },
      { $set: { copyright: copyright.trim(), ...(clientLogo ? { clientLogo } : {}) }, $setOnInsert: { key: "general" } },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );
    req.flash("success", "Đã cập nhật cài đặt website.");
  } catch (error) {
    console.error(error);
    req.flash("error", "Không thể cập nhật cài đặt. Vui lòng thử lại.");
  }
  res.redirect(`${systemConfig.prefixAdmin}/settings`);
};
