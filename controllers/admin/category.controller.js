const Category = require("../../models/category.model");
const systemConfig = require('../../configs/system');
const createTreeHelper = require("../../helpers/createTree");
const searchHelper = require('../../helpers/search');
// GET: /admin/categories
module.exports.index = async (req, res) => {

  let findQuery = {
    deleted: false,
  };

  // xử lý tìm kiếm sản phẩm theo từ khóa
  const objectSearch = searchHelper(req);
  if (objectSearch.regex) {
    findQuery.title = objectSearch.regex;
  }


  const category = await Category.find(findQuery);

  const newCategory = createTreeHelper.tree(category);

  res.render('admin/pages/category/index', {
    pageTitle: 'Trang Danh mục sản phẩm',
    category: newCategory
  });
};

// GET: /admin/categories/create
module.exports.create = async (req, res) => {

  let findQuery = {
    deleted: false,
  };

  const category = await Category.find(findQuery)

  const newCategory = createTreeHelper.tree(category)

  res.render('admin/pages/category/create', {
    pageTitle: 'Thêm danh mục',
    category: newCategory
  });
};

// POST: /admin/categories/create
module.exports.createPost = async (req, res) => {

  if (req.body.position == "") {
    const countCategories = await Category.countDocuments();
    req.body.position = countCategories + 1;
  }
  else {
    req.body.position = parseInt(req.body.position);
  }

  const category = new Category(req.body);
  await category.save();
  req.flash("success", "Đã thêm danh mục thành công!");
  res.redirect(`${systemConfig.prefixAdmin}/categories`);
};

// GET: /admin/categories/edit/:id
module.exports.edit = async (req, res) => {
  const id = req.params.id;

  let findQuery = {
    deleted: false,
    _id: id
  };
  const category = await Category.findOne(findQuery);

  const data = await Category.find({
    deleted: false
  });

  const newCategory = createTreeHelper.tree(data);

  res.render('admin/pages/category/edit', {
    pageTitle: 'Chỉnh sửa danh mục',
    category: category,
    data: newCategory
  });
};

// PATCH: /admin/categories/edit/:id
module.exports.editPost = async (req, res) => {

  req.body.position = parseInt(req.body.position);
  const id = req.params.id;

  if (req.file) {
    req.body.thumbnail = `/uploads/${req.file.filename}`;
  }
  try {
    await Category.updateOne({ _id: id }, req.body);
    req.flash("success", "Cập nhật danh mục thành công!");
    res.redirect(req.get("Referer") || `${systemConfig.prefixAdmin}/categories`)
  }
  catch (error) {
    req.flash("error", "Cập nhật danh mục không thành công!");
    res.redirect(req.get("Referer") || `${systemConfig.prefixAdmin}/categories`);
  }

};
