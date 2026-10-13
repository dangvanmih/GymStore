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

