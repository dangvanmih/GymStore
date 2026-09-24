const Product = require('../../models/product.model');
const filterStatusHelper = require('../../helpers/filterStatus');
const searchHelper = require('../../helpers/search');
const paginationHelper = require('../../helpers/pagination');
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
    limitItems: 8,
  };

  // 3. Gọi helper phân trang
  const objectPagination = paginationHelper(
    initPagination,
    countProducts,
    req
  );


  const products = await Product.find(findQuery).limit(objectPagination.limitItems).skip(objectPagination.skipItems).sort({position: "desc"})


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
  res.redirect(req.get("Referer") || "/admin/products");

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
  res.redirect(req.get("Referer") || "/admin/products");
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

  res.redirect(req.get("Referer") || "/admin/products");
};