const Product = require('../../models/product.model');

// GET: /admin/product
module.exports.index = async (req, res) => {
  let fillterStatus = [
    {
      name: 'Tất cả',
      status: '',
    },
    {
      name: "Hoạt động",
      status: 'active'
    },
    {
      name: "Dừng hoạt động",
      status: 'inactive'
    }
  ];

  if (req.query.status) {
    const index = fillterStatus.findIndex(item => item.status === req.query.status);
    fillterStatus[index].class = 'active';
  }
  else {
    const index = fillterStatus.findIndex(item => item.status === '');
    fillterStatus[index].class = 'active';
  }



  let findQuery = {
    deleted: false,
  };

  //nếu có query status thì thêm vào findQuery
  if (req.query.status) {
    findQuery.status = req.query.status;
  };

  // xử lý tìm kiếm sản phẩm theo từ khóa
  let keyword = "";
  if (req.query.keyword) {
    keyword = req.query.keyword;
    const regex = new RegExp(keyword, 'i'); // 'i' để tìm kiếm không phân biệt chữ hoa chữ thường
    findQuery.title = regex;
  };

  const products = await Product.find(findQuery)


  res.render('admin/pages/product/index', {
    pageTitle: 'Trang sản phẩm',
    products: products,
    fillterStatus: fillterStatus,
    keyword: keyword
  });
}