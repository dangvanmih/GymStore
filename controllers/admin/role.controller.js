const Role = require("../../models/role.model")
const systemConfig = require("../../configs/system")
// GET: /admin/roles
module.exports.index = async (req, res) => {

  let findQuery = {
    deleted: false,
  };

  const role = await Role.find(findQuery);

  res.render('admin/pages/role/index', {
    pageTitle: 'Trang danh sách quyền',
    role: role
  });
};

// GET: /admin/roles/create
module.exports.create = async (req, res) => {

  res.render('admin/pages/role/create', {
    pageTitle: 'Trang thêm mới',
  });
};


// POST: /admin/roles/create
module.exports.createPost = async (req, res) => {

  const role = new Role(req.body);
  await role.save();
  req.flash("success", "Tạo mới quyền thành công!");
  res.redirect(`${systemConfig.prefixAdmin}/roles`);
};

// GET: /admin/roles/edit/:id
module.exports.edit = async (req, res) => {

  let findQuery = {
    deleted: false,
    _id: req.params.id
  };

  const role = await Role.findOne(findQuery);

  res.render('admin/pages/role/edit', {
    pageTitle: 'Trang chỉnh sửa',
    role: role
  });
};

// PATCH: /admin/roles/edit/:id
module.exports.editPatch = async (req, res) => {

  const id = req.params.id
  try {
    await Role.updateOne({ _id: id }, req.body);
    req.flash("success", "Cập nhật nhóm quyền thành công!");
    res.redirect(req.get("Referer") || `${systemConfig.prefixAdmin}/roles`)
  } catch (error) {
    req.flash("error", "Cập nhật nhóm quyền không thành công!");
    res.redirect(req.get("Referer") || `${systemConfig.prefixAdmin}/roles`);
  }
};

// DELETE: /admin/roles/delete/:id
module.exports.delete = async (req, res) => {

  const id = req.params.id
  try {
    await Role.updateOne({ _id: id }, {deleted:true});
    req.flash("success", "Xóa vai trò thành công!");
    res.redirect(req.get("Referer") || `${systemConfig.prefixAdmin}/roles`)
  } catch (error) {
    req.flash("error", "Xóa vai trò không thành công!");
    res.redirect(req.get("Referer") || `${systemConfig.prefixAdmin}/roles`);
  }
};