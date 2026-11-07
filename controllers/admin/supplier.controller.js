const Supplier = require("../../models/supplier.model");
const Product = require("../../models/product.model");
const systemConfig = require("../../configs/system");

const basePath = `${systemConfig.prefixAdmin}/suppliers`;
const readFields = body => ({
  name: String(body.name || "").trim(),
  contactName: String(body.contactName || "").trim(),
  phone: String(body.phone || "").trim(),
  email: String(body.email || "").trim().toLowerCase(),
  address: String(body.address || "").trim(),
  description: String(body.description || "").trim(),
  status: body.status === "inactive" ? "inactive" : "active"
});

module.exports.index = async (req, res) => {
  const suppliers = await Supplier.find({ deleted: false }).sort({ name: 1 }).lean();
  res.render("admin/pages/supplier/index", { pageTitle: "Nhà cung cấp", suppliers });
};

module.exports.create = (req, res) => {
  res.render("admin/pages/supplier/form", { pageTitle: "Thêm nhà cung cấp", supplier: null, formAction: `${basePath}/create`, isEdit: false });
};

module.exports.createPost = async (req, res) => {
  const fields = readFields(req.body);
  if (!fields.name) {
    req.flash("error", "Vui lòng nhập tên nhà cung cấp.");
    return res.redirect("back");
  }
  const duplicate = await Supplier.findOne({ name: { $regex: `^${fields.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" }, deleted: false });
  if (duplicate) {
    req.flash("error", "Tên nhà cung cấp đã tồn tại.");
    return res.redirect("back");
  }
  await Supplier.create(fields);
  req.flash("success", "Đã thêm nhà cung cấp.");
  return res.redirect(basePath);
};

module.exports.edit = async (req, res) => {
  const supplier = await Supplier.findOne({ _id: req.params.id, deleted: false }).lean();
  if (!supplier) {
    req.flash("error", "Không tìm thấy nhà cung cấp.");
    return res.redirect(basePath);
  }
  return res.render("admin/pages/supplier/form", { pageTitle: "Sửa nhà cung cấp", supplier, formAction: `${basePath}/edit/${supplier._id}?_method=PATCH`, isEdit: true });
};

module.exports.editPost = async (req, res) => {
  const fields = readFields(req.body);
  if (!fields.name) {
    req.flash("error", "Vui lòng nhập tên nhà cung cấp.");
    return res.redirect("back");
  }
  const escapedName = fields.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const duplicate = await Supplier.findOne({ _id: { $ne: req.params.id }, name: { $regex: `^${escapedName}$`, $options: "i" }, deleted: false });
  if (duplicate) {
    req.flash("error", "Tên nhà cung cấp đã tồn tại.");
    return res.redirect("back");
  }
  const supplier = await Supplier.findOneAndUpdate({ _id: req.params.id, deleted: false }, { $set: fields }, { new: true });
  if (!supplier) {
    req.flash("error", "Không tìm thấy nhà cung cấp.");
    return res.redirect(basePath);
  }
  req.flash("success", "Đã cập nhật nhà cung cấp.");
  return res.redirect(basePath);
};

module.exports.delete = async (req, res) => {
  const supplier = await Supplier.findOne({ _id: req.params.id, deleted: false });
  if (!supplier) {
    req.flash("error", "Không tìm thấy nhà cung cấp.");
    return res.redirect(basePath);
  }
  const productCount = await Product.countDocuments({ supplier_id: String(supplier._id), deleted: false });
  if (productCount > 0) {
    req.flash("error", `Không thể xóa vì nhà cung cấp đang được gán cho ${productCount} sản phẩm.`);
    return res.redirect(basePath);
  }
  supplier.deleted = true;
  supplier.deletedAt = new Date();
  await supplier.save();
  req.flash("success", "Đã xóa nhà cung cấp.");
  return res.redirect(basePath);
};
