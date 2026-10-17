const Account = require("../../models/account.model");
const Role = require("../../models/role.model");
const systemConfig = require("../../configs/system");
const bcrypt = require("bcrypt");

// GET: /admin/accounts
module.exports.index = async (req, res) => {

  let findQuery = {
    deleted: false,
  };

  const account = await Account.find(findQuery).select("-password -token");
  for (const record of account) {
    const role = await Role.findOne({
      _id: record.role_id,
      deleted: false,
    })
    record.role = role;
  }
  res.render('admin/pages/account/index', {
    pageTitle: 'Danh sách tài khoản',
    account: account
  });
};

// GET: /admin/accounts/create
module.exports.create = async (req, res) => {
  const find = {
    deleted: false
  }
  const role = await Role.find(find);

  res.render('admin/pages/account/create', {
    pageTitle: 'Tạo mới tài khoản',
    roles: role
  });
};

// POST: /admin/accounts/create
module.exports.createPost = async (req, res) => {
  try {

    const emailExist = await Account.findOne({
      email: req.body.email,
      deleted: false
    });

    if (emailExist) {
      req.flash("error", "Email đã tồn tại!");
      res.redirect(`${systemConfig.prefixAdmin}/accounts/create`);
    }
    else {
      const password = req.body.password;
      req.body.password = await bcrypt.hash(password, 10);
      const account = new Account(req.body)
      await account.save();

      req.flash("success", "Tạo tài khoản thành công!");
      res.redirect(`${systemConfig.prefixAdmin}/accounts`);
    }
  } catch (error) {
    console.error(error);

    req.flash("error", "Tạo tài khoản thất bại!");
    res.redirect(`${systemConfig.prefixAdmin}/accounts`);
  }
};

// GET: /admin/accounts
module.exports.edit = async (req, res) => {

  const find = {
    deleted: false,
    _id: req.params.id
  }
  try {
    const account = await Account.findOne(find);
    const roles = await Role.find({
      deleted: false
    })
    res.render('admin/pages/account/edit', {
      pageTitle: 'Chỉnh sửa tài khoản',
      account: account,
      roles: roles
    });
  } catch (error) {

  }
};

// PATCH: /admin/accounts/edit/:id
module.exports.editPatch = async (req, res) => {
  const id = req.params.id;

  try {
    const email = req.body.email.trim();

    // Tìm tài khoản khác đang sử dụng email này
    const emailExist = await Account.findOne({
      email: email,
      deleted: false,
      _id: { $ne: id }
    });

    if (emailExist) {
      req.flash("error", "Email đã tồn tại!");
      return res.redirect(req.get("Referer"));
    }

    // Nếu có nhập mật khẩu thì mã hóa
    if (req.body.password) {
      req.body.password = await bcrypt.hash(req.body.password, 10);
    } else {
      // Không nhập mật khẩu thì giữ nguyên mật khẩu cũ
      delete req.body.password;
    }

    await Account.updateOne(
      { _id: id, deleted: false },
      req.body
    );

    req.flash("success", "Cập nhật tài khoản thành công!");
    return res.redirect(req.get("Referer"));

  } catch (error) {
    console.error(error);

    req.flash("error", "Cập nhật tài khoản không thành công!");
    return res.redirect(req.get("Referer"));
  }
};