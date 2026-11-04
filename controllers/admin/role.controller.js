const Role = require("../../models/role.model")
const systemConfig = require("../../configs/system")
const { isAdministratorRole } = require("../../configs/permissions");
// GET: /admin/roles
module.exports.index = async (req, res) => {

  let findQuery = {
    deleted: false,
  };

  const roles = await Role.find(findQuery);

  res.render('admin/pages/role/index', {
    pageTitle: 'Trang danh sách vai trò',
    roles: roles
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
  try {
    // 1. Kiểm tra xem nhóm quyền đã tồn tại chưa (không phân biệt hoa thường)
    const existingRole = await Role.findOne({
      title: { $regex: new RegExp(`^${req.body.title}$`, "i") },
      deleted: false
    });

    if (existingRole) {
      req.flash("error", "Nhóm quyền này đã tồn tại!");
      return res.redirect(req.get("Referer"));
    }

    // 2. Nếu chưa tồn tại thì tiến hành lưu mới
    const role = new Role(req.body);
    await role.save();

    req.flash("success", "Tạo mới quyền thành công!");
    res.redirect(`${systemConfig.prefixAdmin}/roles`);

  } catch (error) {
    req.flash("error", "Tạo mới quyền không thành công!");
    res.redirect(`${systemConfig.prefixAdmin}/roles`);
  }
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
    // 1. Kiểm tra xem nhóm quyền đã tồn tại chưa (không phân biệt hoa thường)
    const existingRole = await Role.findOne({
      title: { $regex: new RegExp(`^${req.body.title}$`, "i") },
      deleted: false
    });

    if (existingRole) {
      req.flash("error", "Nhóm quyền này đã tồn tại!");
      return res.redirect(req.get("Referer"));
    }
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
  try {
    const id = req.params.id;

    // 1. Tìm thông tin role trước khi xóa
    const role = await Role.findOne({ _id: id, deleted: false });

    if (!role) {
      req.flash("error", "Vai trò không tồn tại!");
      return res.redirect(req.get("Referer") || `${systemConfig.prefixAdmin}/roles`);
    }

    // 2. Kiểm tra nếu là nhóm Quản trị viên thì chặn lại không cho xóa
    if (role.title.toLowerCase() === "quản trị viên" || role.title.toLowerCase() === "admin") {
      req.flash("error", "Không được phép xóa nhóm quyền Quản trị viên!");
      return res.redirect(req.get("Referer") || `${systemConfig.prefixAdmin}/roles`);
    }

    // 3. Nếu không phải thì tiến hành xóa mềm như bình thường
    await Role.updateOne({ _id: id }, { deleted: true, deletedAt: new Date() });
    
    req.flash("success", "Xóa vai trò thành công!");
    res.redirect(req.get("Referer") || `${systemConfig.prefixAdmin}/roles`);

  } catch (error) {
    console.log("Lỗi xóa vai trò:", error);
    req.flash("error", "Xóa vai trò không thành công!");
    res.redirect(req.get("Referer") || `${systemConfig.prefixAdmin}/roles`);
  }
};

// GET: /admin/roles/permissions
module.exports.permission = async (req, res) => {

  let findQuery = {
    deleted: false,
  };

  const records = await Role.find(findQuery);
  records.forEach(role => {
    if (isAdministratorRole(role.title)) {
      role.permissions = [...new Set([...(role.permissions || []), "roles_permission"])];
    }
  });

  res.render('admin/pages/role/permission', {
    pageTitle: 'Trang danh sách quyền',
    records: records
  });
};

// PATCH: /admin/roles/permissions
module.exports.permissionPatch = async (req, res) => {
  try {
    const permissionsPayload = req.body.permissions;
    const permissions = Array.isArray(permissionsPayload)
      ? permissionsPayload
      : JSON.parse(permissionsPayload || '[]');

    if (Array.isArray(permissions) && permissions.length > 0) {
      // Lưu các quyền được chọn trong bảng phân quyền.
      for (const item of permissions) {
        const role = await Role.findOne({ _id: item.id, deleted: false });
        if (!role) continue;

        const finalPermissions = new Set(
          Array.isArray(item.permissions) ? item.permissions : []
        );
        if (isAdministratorRole(role.title)) finalPermissions.add("roles_permission");

        await Role.findByIdAndUpdate(
          item.id,
          { $set: { permissions: [...finalPermissions] } },
          { runValidators: true }
        );
      }

      req.flash("success", "Cập nhật phân quyền thành công!");
    } else {
      req.flash("error", "Dữ liệu phân quyền không hợp lệ!");
    }

    res.redirect(
      req.get("Referer") ||
      `${systemConfig.prefixAdmin}/roles/permissions`
    );
  } catch (error) {
    console.error(error);

    req.flash("error", "Cập nhật phân quyền không thành công!");

    res.redirect(
      req.get("Referer") ||
      `${systemConfig.prefixAdmin}/roles/permissions`
    );
  }
};
