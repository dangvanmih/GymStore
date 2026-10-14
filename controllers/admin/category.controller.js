const Category = require("../../models/category.model");
const systemConfig = require('../../configs/system');
const createTreeHelper = require("../../helpers/createTree");
const searchHelper = require('../../helpers/search');
// GET: /admin/categories
module.exports.index = async (req, res) => {

  let findQuery = {
    deleted: false,
  };

  // sort
  let sortQuery = {};
  if (req.query.sortKey && req.query.sortValue) {
    sortQuery[req.query.sortKey] = req.query.sortValue;
  }
  else {
    sortQuery.position = "desc"; // sắp xếp theo vị trí giảm dần
  }
  // end sors

  // xử lý tìm kiếm sản phẩm theo từ khóa
  const objectSearch = searchHelper(req);
  if (objectSearch.regex) {
    findQuery.title = objectSearch.regex;
  }


  const category = await Category.find(findQuery).sort(sortQuery);

  const newCategory = createTreeHelper.tree(category);

  res.render('admin/pages/category/index', {
    pageTitle: 'Trang Danh mục sản phẩm',
    category: newCategory,
    keyword: objectSearch.keyword
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

// PATCH: /admin/categories/change-multi
module.exports.changeMulti = async (req, res) => {

  const type = req.body.type;
  const ids = req.body.ids.split(", ");

  switch (type) {
    case "active":
      await Category.updateMany({ _id: { $in: ids } }, { status: "active" });
      req.flash("success", `Đã cập nhật trạng thái ${ids.length} danh mục!`)
      break;
    case "inactive":
      await Category.updateMany({ _id: { $in: ids } }, { status: "inactive" });
      req.flash("success", `Đã cập nhật trạng thái ${ids.length} danh mục!`)
      break;
    case "delete-all":
      await Category.updateMany({ _id: { $in: ids } }, { deleted: true }, { deletedAt: new Date() });
      req.flash("success", `Đã xóa ${ids.length} danh mục!`)
      break;
    case "change-position":
      for (const item of ids) {
        let [id, position] = item.split("-");
        position = parseInt(position);

        await Category.updateOne({ _id: id }, { position: position });
      }
      req.flash("success", `Đã cập nhật vị trí ${ids.length} danh mục!`)
      break;
    default:
      break;
  }
  res.redirect(req.get("Referer") || `${systemConfig.prefixAdmin}/categories`);
};

// PATCH: /admin/categories/change-status/:status/:id
module.exports.changeStatus = async (req, res) => {

  const status = req.params.status;
  const id = req.params.id

  await Category.updateOne({ _id: id }, { status: status });
  req.flash("success", "Cập nhật trạng thái thành công!")
  res.redirect(req.get("Referer") || `${systemConfig.prefixAdmin}/categories`);

};

// DELETE: /admin/product/delete/:id
module.exports.deleteCategory = async (req, res) => {
  const id = req.params.id;

  await Category.updateOne(
    { _id: id },
    { deleted: true },
    { deletedAt: new Date() },
  );
  req.flash("success", "Đã xóa thành công!");
  res.redirect(req.get("Referer") || `${systemConfig.prefixAdmin}/categories`);
};