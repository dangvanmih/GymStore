const Category = require("../../models/category.model");

// Hàm đệ quy tạo cây danh mục an toàn tuyệt đối
const createTree = (arr, parentId = "") => {
  const tree = [];
  arr.forEach((item) => {
    // Chuyển parent_id về chuỗi (hoặc rỗng nếu null/undefined) để so sánh chuẩn xác
    const itemParentId = item.parent_id ? item.parent_id.toString() : "";
    const targetParentId = parentId ? parentId.toString() : "";

    if (itemParentId === targetParentId) {
      const children = createTree(arr, item._id.toString());
      if (children.length > 0) {
        item.children = children;
      }
      tree.push(item);
    }
  });
  return tree;
};

module.exports.category = async (req, res, next) => {
  try {
    const categories = await Category.find({
      deleted: false,
      status: "active"
    }).lean();

    // Chuẩn hóa _id thành string (item.id) để dễ so sánh trong đệ quy
    const formattedCategories = categories.map(item => ({
      ...item,
      id: item._id.toString()
    }));

    // Gọi hàm tạo cây danh mục
    const newCategories = createTree(formattedCategories, "");

    res.locals.layoutCategories = newCategories;
    next();
  } catch (error) {
    console.log(error);
    next();
  }
};