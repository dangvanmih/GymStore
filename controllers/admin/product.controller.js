const Product = require('../../models/product.model');
const filterStatusHelper = require('../../helpers/filterStatus');
const searchHelper = require('../../helpers/search');
const paginationHelper = require('../../helpers/pagination')
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


  const products = await Product.find(findQuery).limit(objectPagination.limitItems).skip(objectPagination.skipItems)


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

  await Product.updateOne({_id: id}, {status: status});

  res.redirect(req.get("Referer") || "/admin/products");

};

// PATCH: /admin/product/change-multi
module.exports.changeMulti = async (req, res) => {

  const type = req.body.type;
  const ids = req.body.ids.split(", ");

  switch (type) {
    case "active":
      await Product.updateMany({_id: {$in: ids}}, {status: "active"});
      break;
    case "inactive":
      await Product.updateMany({_id: {$in: ids}}, {status: "inactive"});
      break;
    default:
      break;
  }
  res.redirect(req.get("Referer") || "/admin/products");
}