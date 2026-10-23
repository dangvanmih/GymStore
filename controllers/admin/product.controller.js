const Product = require('../../models/product.model');
const filterStatusHelper = require('../../helpers/filterStatus');
const searchHelper = require('../../helpers/search');
const paginationHelper = require('../../helpers/pagination');
const systemConfig = require('../../configs/system');
const createTreeHelper = require("../../helpers/createTree");
const Category = require('../../models/category.model');
const Account = require('../../models/account.model');
const {calculatePriceNew}= require('../../helpers/calculatePrice')
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
      await Product.updateMany(
        { _id: { $in: ids } },
        {
          deleted: true,
          deletedBy: {
            account_id: res.locals.user.id,
            deletedAt: new Date()
          }
        });
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
    {
      deleted: true,
      deletedBy: {
        account_id: res.locals.user.id,
        deletedAt: new Date()
      }
    },
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
  // 1. Xử lý giá chung và phần trăm giảm giá chung (Xử lý bỏ dấu chấm nếu có)
  const rawPrice = req.body.price ? req.body.price.toString().replace(/\./g, "") : "0";
  const price = parseInt(rawPrice) || 0;
  const discountPercentage = parseInt(req.body.discountPercentage) || 0;

  req.body.price = price;
  req.body.discountPercentage = discountPercentage;

  // Tính giá mới chung của sản phẩm (có làm tròn đẹp)
  req.body.priceNew = calculatePriceNew(price, discountPercentage);

  // 2. Xử lý cờ phân loại Size/Màu (hasVariants)
  if (req.body.hasVariants === "true" || req.body.hasVariants === true) {
    req.body.hasVariants = true;
    req.body.stock = 0; // Đặt stock chung = 0 khi dùng biến thể

    // Ép kiểu mảng variants gửi lên từ form
    if (Array.isArray(req.body.variants)) {
      req.body.variants = req.body.variants
        .filter((item) => item.size && item.size.trim() !== "") // Lọc bỏ dòng trống size
        .map((item) => {
          // Xử lý bỏ dấu chấm cho giá riêng của biến thể
          const rawVariantPrice = item.price ? item.price.toString().replace(/\./g, "") : "0";
          // Nếu không nhập giá riêng hoặc để 0 thì lấy giá chung của sản phẩm
          const variantPrice = parseInt(rawVariantPrice) > 0 ? parseInt(rawVariantPrice) : price;

          // Tính giá sau giảm cho riêng biến thể này (có làm tròn đẹp)
          const variantPriceNew = calculatePriceNew(variantPrice, discountPercentage);

          return {
            size: item.size.trim().toUpperCase(), // Tự động ép size thành chữ hoa (S, M, L...)
            color: item.color ? item.color.trim() : "",
            price: variantPrice,
            priceNew: variantPriceNew,
            stock: parseInt(item.stock) || 0
          };
        });
    } else {
      req.body.variants = [];
    }
  } else {
    // Trường hợp sản phẩm đơn lẻ (Không có biến thể)
    req.body.hasVariants = false;
    req.body.stock = parseInt(req.body.stock) || 0;
    req.body.variants = [];
  }

  // 3. Xử lý vị trí hiển thị (position)
  if (!req.body.position || req.body.position === "") {
    const countProducts = await Product.countDocuments();
    req.body.position = countProducts + 1;
  } else {
    req.body.position = parseInt(req.body.position);
  }

  // 4. Lưu thông tin người tạo
  if (res.locals && res.locals.user) {
    req.body.createdBy = {
      account_id: res.locals.user.id,
      createdAt: new Date()
    };
  }

  // 5. Lưu vào Database
  try {
    const product = new Product(req.body);
    await product.save();

    req.flash("success", "Đã thêm sản phẩm thành công!");
    res.redirect(`${systemConfig.prefixAdmin}/products`);
  } catch (error) {
    console.error("Lỗi khi thêm sản phẩm:", error);
    req.flash("error", "Thêm sản phẩm thất bại, vui lòng thử lại!");
    res.redirect(req.get("Referer"));
  }
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

  // 1. Xử lý giá chung và phần trăm giảm giá chung (Xử lý bỏ dấu chấm nếu có)
  const rawPrice = req.body.price ? req.body.price.toString().replace(/\./g, "") : "0";
  const price = parseInt(rawPrice) || 0;
  const discountPercentage = parseInt(req.body.discountPercentage) || 0;

  req.body.price = price;
  req.body.discountPercentage = discountPercentage;
  req.body.position = parseInt(req.body.position) || 0;

  // Tính giá mới chung của sản phẩm (có làm tròn đẹp)
  req.body.priceNew = calculatePriceNew(price, discountPercentage);

  // 2. Xử lý phân loại Size, Màu & Giá riêng
  if (req.body.hasVariants === "true" || req.body.hasVariants === true) {
    req.body.hasVariants = true;
    req.body.stock = 0; // Đưa stock chung về 0 khi dùng phân loại

    if (Array.isArray(req.body.variants)) {
      req.body.variants = req.body.variants
        .filter((item) => item.size && item.size.trim() !== "")
        .map((item) => {
          // Xử lý bỏ dấu chấm cho giá riêng của biến thể
          const rawVariantPrice = item.price ? item.price.toString().replace(/\./g, "") : "0";
          // Nếu không nhập giá riêng hoặc để 0 thì lấy giá chung của sản phẩm
          const variantPrice = parseInt(rawVariantPrice) > 0 ? parseInt(rawVariantPrice) : price;
          
          // Tính giá sau giảm cho riêng biến thể này (có làm tròn đẹp)
          const variantPriceNew = calculatePriceNew(variantPrice, discountPercentage);

          return {
            size: item.size.trim().toUpperCase(), // Tự động ép size thành chữ hoa (S, M, L...)
            color: item.color ? item.color.trim() : "",
            price: variantPrice,
            priceNew: variantPriceNew,
            stock: parseInt(item.stock) || 0
          };
        });
    } else {
      req.body.variants = [];
    }
  } else {
    req.body.hasVariants = false;
    req.body.stock = parseInt(req.body.stock) || 0;
    req.body.variants = []; // Xóa mảng variants nếu chuyển sản phẩm về Free Size
  }

  // 3. Thực hiện cập nhật vào Database
  try {
    const updateData = { ...req.body };

    // Không cập nhật updatedBy bằng $set trực tiếp
    delete updateData.updatedBy;

    await Product.updateOne(
      { _id: id, deleted: false },
      {
        $set: updateData,
        $push: {
          updatedBy: {
            account_id: res.locals.user.id,
            updatedAt: new Date()
          }
        }
      }
    );
    req.flash("success", "Cập nhật sản phẩm thành công!");
  } catch (error) {
    req.flash("error", "Cập nhật sản phẩm thất bại!");
    console.error("Lỗi cập nhật sản phẩm:", error);
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

    const latestUpdate = product.updatedBy?.length
      ? product.updatedBy[product.updatedBy.length - 1]
      : null;

    const updatedByUser = latestUpdate
      ? await Account.findOne({
        _id: latestUpdate.account_id
      }).select("fullName")
      : null;

    product.priceNew = Math.round(
      product.price * (1 - product.discountPercentage / 100) / 10000
    ) * 10000;

    res.render('admin/pages/product/detail', {
      pageTitle: 'Trang chi tiết sản phẩm',
      product: product,
      category: category,
      createByUser: createByUser,
      updatedByUser: updatedByUser,
      latestUpdate: latestUpdate
    });
  }
  catch (error) {
    req.flash("error", "Không tìm thấy sản phẩm!");
    res.redirect(
      req.get("Referer") || `${systemConfig.prefixAdmin}/products`
    );
  }
};
