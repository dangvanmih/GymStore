const Product = require('../../models/product.model');
const filterStatusHelper = require('../../helpers/filterStatus');
const searchHelper = require('../../helpers/search');

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
  let objectPagination = {
    currentPage: 1,
    limitItems: 2,
  };
  if (req.query.page) {
    objectPagination.currentPage = parseInt(req.query.page);
  };
  objectPagination.skipItems = (objectPagination.currentPage - 1) * objectPagination.limitItems;
  const totalItems = await Product.countDocuments(findQuery) / objectPagination.limitItems;
  objectPagination.totalPages = Math.ceil(totalItems);


  const products = await Product.find(findQuery).limit(objectPagination.limitItems).skip(objectPagination.skipItems)


  res.render('admin/pages/product/index', {
    pageTitle: 'Trang sản phẩm',
    products: products,
    filterStatus: filterStatus,
    keyword: objectSearch.keyword,
    pagination: objectPagination
  });
}