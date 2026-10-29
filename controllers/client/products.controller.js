const Product = require("../../models/product.model");
const Category = require("../../models/category.model");
const { calculatePriceNew } = require("../../helpers/calculatePrice");
const { calculateProductsPrice } = require("../../helpers/productPrice");

// GET: /products
module.exports.index = async (req, res) => {

  const products = await Product.find({
    status: "active",
    deleted: false
  }).sort({ position: "desc" }).lean();

  const newProducts = products.map(item => {
    item.priceNew = Math.round(
      item.price * (1 - item.discountPercentage / 100) / 10000
    ) * 10000;
    return item;
  })

  res.render("client/pages/products/index", {
    pageTitle: "Trang sản phẩm",
    products: newProducts
  });
};
// GET: /products/:slug/detail
module.exports.detailProduct = async (req, res) => {
  try {
    const slug = req.params.slug;
    const product = await Product.findOne({
      slug: slug,
      status: "active",
      deleted: false
    }).lean();

    if (!product) {
      req.flash("error", "Sản phẩm không tồn tại!");
      return res.redirect("/");
    }

    const discount = Number(product.discountPercentage) || 0;

    // 1. Xử lý logic giá cho sản phẩm CÓ phân loại (Variants) hoặc KHÔNG có phân loại
    if (product.hasVariants && product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
      // Chuẩn hóa và tính lại priceNew cho từng variant nếu cần, hoặc lấy trực tiếp
      product.variants = product.variants.map(v => {
        const vPrice = Number(v.price) || Number(product.price) || 0;
        const vPriceNew = discount > 0
          ? Math.round((vPrice * (100 - discount) / 100) / 10000) * 10000
          : vPrice;
        return {
          ...v,
          price: vPrice,
          priceNew: v.priceNew || vPriceNew
        };
      });

      // Mặc định lấy giá của size đầu tiên làm giá hiển thị ban đầu khi load trang
      product.price = product.variants[0].price;
      product.priceNew = product.variants[0].priceNew;
    } else {
      // Sản phẩm không có phân loại (Free size / Giá chung)
      const basePrice = Number(product.price) || 0;
      product.priceNew = discount > 0
        ? Math.round((basePrice * (100 - discount) / 100) / 10000) * 10000
        : basePrice;
      product.price = basePrice;
      product.variants = []; // Đảm bảo mảng rỗng để file Pug tự động ẩn phần chọn size
    }

    res.render("client/pages/products/detail", {
      pageTitle: product.title,
      product: product
    });
  } catch (error) {
    console.log("Lỗi chi tiết sản phẩm:", error);
    res.redirect("/");
  }
};

// [GET] /products/:slug
module.exports.category = async (req, res) => {
  try {
    const slug = req.params.slug;

    // 1. Tìm danh mục hiện tại theo slug
    const category = await Category.findOne({
      slug: slug,
      deleted: false,
      status: "active"
    });

    if (!category) {
      req.flash("error", "Không tìm thấy danh mục!");
      return res.redirect("/");
    }

    // 2. Viết hàm đệ quy tìm tất cả các danh mục con
    const getSubCategory = async (parentId) => {
      const subs = await Category.find({
        parent_id: parentId.toString(),
        deleted: false,
        status: "active"
      });

      let allSubIds = [...subs.map(sub => sub._id)];

      for (const sub of subs) {
        const childIds = await getSubCategory(sub._id);
        allSubIds = allSubIds.concat(childIds);
      }

      return allSubIds;
    };

    const listSubCategoryId = await getSubCategory(category._id);
    const listIdCategory = [category._id.toString(), ...listSubCategoryId.map(id => id.toString())];

    // Lấy tất cả sản phẩm gốc của danh mục để làm bộ lọc màu/size
    const allProductsInCate = await Product.find({
      category_id: { $in: listIdCategory },
      deleted: false,
      status: "active"
    });

    const availableColors = [
      ...new Set(
        allProductsInCate.flatMap(item =>
          item.variants ? item.variants.map(v => v.color).filter(c => c && c.trim() !== "") : []
        )
      )
    ];

    const availableSizes = [
      ...new Set(
        allProductsInCate.flatMap(item =>
          item.variants ? item.variants.map(v => v.size).filter(s => s && s.trim() !== "") : []
        )
      )
    ];

    // 3. XÂY DỰNG ĐIỀU KIỆN TÌM KIẾM (LỌC GIÁ, MÀU, SIZE LINH HOẠT)
    let find = {
      category_id: { $in: listIdCategory },
      deleted: false,
      status: "active"
    };

    // Mảng chứa các điều kiện lọc (dùng $and để kết hợp nhiều bộ lọc cùng lúc)
    let conditions = [];

    // 3.1. Lọc theo Giá
    if (req.query.price) {
      let minPrice = 0;
      let maxPrice = 999999999;

      if (req.query.price === "under-200k") {
        minPrice = 0;
        maxPrice = 200000;
      } else if (req.query.price === "200k-500k") {
        minPrice = 200000;
        maxPrice = 500000;
      } else if (req.query.price === "500k-800k") {
        minPrice = 500000;
        maxPrice = 800000;
      } else if (req.query.price === "over-800k") {
        minPrice = 800000;
        maxPrice = 999999999;
      }

      conditions.push({
        $or: [
          // 1. Nếu là sản phẩm thường (không có variants) nằm trong khoảng giá
          {
            $and: [
              { hasVariants: { $ne: true } },
              {
                $or: [
                  { priceNew: { $gte: minPrice, $lte: maxPrice } },
                  { price: { $gte: minPrice, $lte: maxPrice } }
                ]
              }
            ]
          },
          // 2. Nếu là sản phẩm có variants -> dùng $elemMatch để kiểm tra từng phân loại bên trong
          {
            "variants": {
              $elemMatch: {
                $or: [
                  { priceNew: { $gte: minPrice, $lte: maxPrice } },
                  { price: { $gte: minPrice, $lte: maxPrice } }
                ]
              }
            }
          }
        ]
      });
    }

    // 3.2. Lọc theo Màu sắc
    if (req.query.color) {
      conditions.push({
        $or: [
          { "variants.color": req.query.color },
          { color: req.query.color }
        ]
      });
    }

    // 3.3. Lọc theo Kích thước
    if (req.query.size) {
      conditions.push({
        $or: [
          { "variants.size": req.query.size },
          { size: req.query.size }
        ]
      });
    }

    // Nếu có các điều kiện lọc, gộp chung vào biến `find` chính bằng `$and`
    if (conditions.length > 0) {
      find.$and = conditions;
    }

    // 4. Lấy danh sách sản phẩm sau khi lọc

    const products = await Product.find(find);

    const newProducts = products.map(item => {
      let displayPrice = item.price;
      let displayPriceNew = calculatePriceNew(item.price, item.discountPercentage);

      if (item.hasVariants && item.variants && item.variants.length > 0) {
        displayPrice = item.variants[0].price;
        displayPriceNew = item.variants[0].priceNew || calculatePriceNew(displayPrice, item.discountPercentage);
      }

      return {
        ...item._doc,
        price: displayPrice,
        priceNew: displayPriceNew
      };
    });

    // 5. XỬ LÝ PHẢN HỒI CHO AJAX REQUEST (KHÔNG LOAD LẠI TRANG)
    if (req.xhr || req.headers['x-requested-with'] === 'XMLHttpRequest') {
      return res.render("client/partials/product-list.pug", {
        products: newProducts
      }, (err, html) => {
        if (err) {
          console.log("Lỗi render partial:", err);
          return res.status(500).json({ error: "Lỗi render HTML" });
        }
        return res.json({
          code: 200,
          html: html
        });
      });
    }

    // 6. Render trang bình thường nếu load lần đầu
    res.render("client/pages/products/index", {
      pageTitle: category.title,
      products: newProducts,
      availableColors: availableColors,
      availableSizes: availableSizes,
      slug: slug
    });

  } catch (error) {
    console.log("Lỗi lọc sản phẩm:", error);
    res.redirect("/");
  }
};

// GET: /products/featured
module.exports.featured = async (req, res) => {

  // Lấy ra sản phẩm nổi bật
  const productFeatured = await Product.find({
    featured: "1",
    deleted: false,
    status: "active"
  }).limit(4);

  const newProductFeatured = calculateProductsPrice(productFeatured)

  res.render("client/pages/products/index", {
    pageTitle: "Sản phẩm nổi bật",
    products: newProductFeatured
  });
}

// GET: /api/search
module.exports.searchSuggestion = async (req, res) => {
  try {
    const keyword = req.query.keyword || "";

    if (!keyword.trim()) {
      return res.json({ products: [], total: 0 });
    }

    // Tạo biểu thức chính quy (regex) không phân biệt hoa thường để tìm kiếm gần đúng
    const regex = new RegExp(keyword, "i");

    // Tìm kiếm các sản phẩm khớp với tiêu đề và chưa bị xóa, đang active
    const products = await Product.find({
      title: regex,
      status: "active",
      deleted: false
    }).limit(5).lean(); // Lấy tối đa 5 sản phẩm

    // Đếm tổng số lượng sản phẩm khớp từ khóa (để hiển thị "Xem thêm X sản phẩm")
    const total = await Product.countDocuments({
      title: regex,
      status: "active",
      deleted: false
    });

    res.json({
      products: products,
      total: total,
      keyword: keyword
    });
  } catch (error) {
    console.log("Lỗi Live Search:", error);
    res.json({ products: [], total: 0 });
  }
};

// GET: /search
module.exports.search = async (req, res) => {
  try {
    const keyword = req.query.q || "";
    let products = [];

    if (keyword.trim()) {
      // Dùng biểu thức chính quy (regex) để tìm kiếm gần đúng, không phân biệt hoa thường
      const regex = new RegExp(keyword, "i");

      products = await Product.find({
        title: regex,
        status: "active",
        deleted: false
      }).lean();

      // (Tùy chọn) Chuẩn hóa lại giá mới và giá cũ cho từng sản phẩm giống trang chủ
      products.forEach(item => {
        let discount = Number(item.discountPercentage) || 0;
        let basePrice = Number(item.price) || 0;
        if (discount > 0 && basePrice > 0) {
          item.priceNew = Math.round((basePrice * (100 - discount) / 100) / 10000) * 10000;
        } else {
          item.priceNew = basePrice;
        }
      });
    }

    res.render("client/pages/products/search", {
      pageTitle: `Kết quả tìm kiếm: ${keyword}`,
      keyword: keyword,
      products: products
    });
  } catch (error) {
    console.log("Lỗi trang tìm kiếm:", error);
    res.redirect("/");
  }
};