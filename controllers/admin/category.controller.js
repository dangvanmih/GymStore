const Category = require("../../models/category.model")
const systemConfig = require('../../configs/system');

// GET: /admin/categories
module.exports.index = async (req, res) => {

  let findQuery = {
    deleted: false,
  };

  const category = await Category.find(findQuery)


  res.render('admin/pages/category/index', {
    pageTitle: 'Trang Danh mục sản phẩm',
    category: category
  });
};

// GET: /admin/categories/create
module.exports.create = async (req, res) => {
  res.render('admin/pages/category/create', {
    pageTitle: 'Thêm danh mục',
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