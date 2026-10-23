const Product = require('../../models/product.model');
const filterStatusHelper = require('../../helpers/filterStatus');
const searchHelper = require('../../helpers/search');
const paginationHelper = require('../../helpers/pagination');
const systemConfig = require('../../configs/system');
const createTreeHelper = require("../../helpers/createTree");
const Category = require('../../models/category.model');
const Account = require('../../models/account.model')
// GET: /admin/product
module.exports.index = async (req, res) => {

  // Lấy danh sách trạng thái lọc từ helper
  const filterStatus = filterStatusHelper(req);

  let findQuery = {
    deleted: false,
  };

  //nếu có query status thì thêm vào findQuery
  if (req.query.status) {
    findQuery.status = req.query.status;
  };

  // xử lý tìm kiếm sản phẩm theo từ khóa
  const objectSearch = searchHelper(req);
  if (objectSearch.regex) {
    findQuery.title = objectSearch.regex;
  }

  // Xử lý phân trang

  // 1. Đếm tổng số sản phẩm thỏa mãn điều kiện
  const countProducts = await Product.countDocuments(findQuery);

  // 2. Định nghĩa cấu hình phân trang ban đầu
  const initPagination = {
    currentPage: 1,
    limitItems: 7,
  };

  // 3. Gọi helper phân trang
  const objectPagination = paginationHelper(
    initPagination,
    countProducts,
    req
  );

  // sort
  let sortQuery = {};
  if (req.query.sortKey && req.query.sortValue) {
    sortQuery[req.query.sortKey] = req.query.sortValue;
  }
  else {
    sortQuery.position = "desc"; // sắp xếp theo vị trí giảm dần
  }
  // end sors
  const products = await Product.find(findQuery).limit(objectPagination.limitItems).skip(objectPagination.skipItems).sort(sortQuery)


  res.render('admin/pages/product/index', {
    pageTitle: 'Trang sản phẩm',
    products: products,
    filterStatus: filterStatus,
    keyword: objectSearch.keyword,
    pagination: objectPagination
  });
};

// PATCH: /admin/product/change-status/:status/:id
module.exports.changeStatus = async (req, res) => {

  const status = req.params.status;
  const id = req.params.id

  await Product.updateOne({ _id: id }, { status: status });
  req.flash("success", "Cập nhật trạng thái thành công!")
  res.redirect(req.get("Referer") || `${systemConfig.prefixAdmin}/products`);

};

// PATCH: /admin/product/change-multi
module.exports.changeMulti = async (req, res) => {

  const type = req.body.type;
  const ids = req.body.ids.split(", ");

  switch (type) {
    case "active":
      await Product.updateMany({ _id: { $in: ids } }, { status: "active" });
      req.flash("success", `Đã cập nhật trạng thái ${ids.length} sản phẩm!`)
      break;
    case "inactive":
      await Product.updateMany({ _id: { $in: ids } }, { status: "inactive" });
      req.flash("success", `Đã cập nhật trạng thái ${ids.length} sản phẩm!`)
      break;
    case "delete-all":
      await Product.updateMany({ _id: { $in: ids } }, { deleted: true }, { deletedAt: new Date() });
      req.flash("success", `Đã xóa ${ids.length} sản phẩm!`)
      break;
    case "change-position":
      for (const item of ids) {
        let [id, position] = item.split("-");
        position = parseInt(position);

        await Product.updateOne({ _id: id }, { position: position });
      }
      req.flash("success", `Đã cập nhật vị trí ${ids.length} sản phẩm!`)
      break;
    default:
      break;
  }
  res.redirect(req.get("Referer") || `${systemConfig.prefixAdmin}/products`);
};

// DELETE: /admin/product/delete/:id
module.exports.deleteProduct = async (req, res) => {
  const id = req.params.id;

  // await Product.deleteOne({_id: id}); // xóa vĩnh viễn

  await Product.updateOne(
    { _id: id },
    { deleted: true },
    { deletedAt: new Date() },
  );
  req.flash("success", "Đã xóa thành công!");
  res.redirect(req.get("Referer") || `${systemConfig.prefixAdmin}/products`);
};

// GET: /admin/product/create
module.exports.createProduct = async (req, res) => {

  let findQuery = {
    deleted: false,
  };

  const category = await Category.find(findQuery)

  const newCategory = createTreeHelper.tree(category)

  res.render('admin/pages/product/create', {
    pageTitle: 'Trang sản phẩm',
    category: newCategory
  });
};

// POST: /admin/product/create
module.exports.createPostProduct = async (req, res) => {
  req.body.price = parseInt(req.body.price) || 0;
  req.body.discountPercentage = parseInt(req.body.discountPercentage) || 0;

  // Kiểm tra cờ phân loại Size
  if (req.body.hasVariants === "true" || req.body.hasVariants === true) {
    req.body.hasVariants = true;
    req.body.stock = 0; // Đặt stock chung = 0

    // Ép kiểu mảng variants gửi lên
    if (Array.isArray(req.body.variants)) {
      req.body.variants = req.body.variants
        .filter((item) => item.size && item.size.trim() !== "") // Loại bỏ dòng rỗng
        .map((item) => ({
          size: item.size.trim(),
          stock: parseInt(item.stock) || 0
        }));
    } else {
      req.body.variants = [];
    }
  } else {
    req.body.hasVariants = false;
    req.body.stock = parseInt(req.body.stock) || 0;
    req.body.variants = [];
  }

  // Xử lý vị trí position
  if (!req.body.position || req.body.position === "") {
    const countProducts = await Product.countDocuments();
    req.body.position = countProducts + 1;
  } else {
    req.body.position = parseInt(req.body.position);
  }

  req.body.createdBy = {
    account_id: res.locals.user.id,
    createdAt: new Date()
  };

  const product = new Product(req.body);
  await product.save();

  req.flash("success", "Đã thêm sản phẩm thành công!");
  res.redirect(`${systemConfig.prefixAdmin}/products`);
};

// GET: /admin/product/edit/:id
module.exports.editProduct = async (req, res) => {
  try {
    const findQuery = {
      deleted: false,
      _id: req.params.id
    };

    const product = await Product.findOne(findQuery);

    const category = await Category.find({ deleted: false });

    const newCategory = createTreeHelper.tree(category);

    res.render('admin/pages/product/edit', {
      pageTitle: 'Trang chỉnh sửa',
      product: product,
      category: newCategory
    });
  }
  catch (error) {
    req.flash("error", "Không tìm thấy sản phẩm!");
    res.redirect(req.get("Referer") || `${systemConfig.prefixAdmin}/products`);
  };
};


// PATCH: /admin/products/edit/:id
module.exports.editPatchProduct = async (req, res) => {
  const id = req.params.id;

  req.body.price = parseInt(req.body.price) || 0;
  req.body.discountPercentage = parseInt(req.body.discountPercentage) || 0;
  req.body.position = parseInt(req.body.position) || 0;

  // Xử lý phân loại Size & Stock
  if (req.body.hasVariants === "true" || req.body.hasVariants === true) {
    req.body.hasVariants = true;
    req.body.stock = 0; // Đưa stock chung về 0 khi dùng phân loại size

    if (Array.isArray(req.body.variants)) {
      req.body.variants = req.body.variants
        .filter((item) => item.size && item.size.trim() !== "")
        .map((item) => ({
          size: item.size.trim(),
          stock: parseInt(item.stock) || 0
        }));
    } else {
      req.body.variants = [];
    }
  } else {
    req.body.hasVariants = false;
    req.body.stock = parseInt(req.body.stock) || 0;
    req.body.variants = []; // Xóa mảng variants nếu chuyển sản phẩm về Free Size
  }

  try {
    req.body.updatedBy = {
      account_id: res.locals.user.id,
      updatedAt: new Date()
    };

    await Product.updateOne({ _id: id }, req.body);
    req.flash("success", "Cập nhật sản phẩm thành công!");
  } catch (error) {
    req.flash("error", "Cập nhật sản phẩm thất bại!");
  }

  res.redirect(req.get("Referer") || `${systemConfig.prefixAdmin}/products`);
};

// GET: /admin/product/detail/:id
module.exports.detailProduct = async (req, res) => {
  const id = req.params.id;
  try {
    const findQuery = {
      deleted: false,
      _id: id
    };

    const product = await Product.findOne(findQuery).lean();
    const category = await Category.findOne({ _id: product.category_id });
    const createByUser = await Account.findOne({
      _id: product.createdBy.account_id
    }).select("fullName");

    const updatedByUser = await Account.findOne({
      _id: product.updatedBy.account_id
    }).select("fullName");

    product.priceNew = Math.round(
      product.price * (1 - product.discountPercentage / 100) / 10000
    ) * 10000;

    res.render('admin/pages/product/detail', {
      pageTitle: 'Trang chi tiết sản phẩm',
      product: product,
      category: category,
      createByUser: createByUser,
      updatedByUser:updatedByUser
    });
  }
  catch (error) {
    req.flash("error", "Không tìm thấy sản phẩm!");
    res.redirect(
      req.get("Referer") || `${systemConfig.prefixAdmin}/products`
    );
  }
};
