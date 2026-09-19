module.exports = (objectPagination, countProducts, req) => {
  // 1. Kiểm tra và gán giá trị hiện tại từ req.query
  if (req.query.page) {
    const page = parseInt(req.query.page);
    objectPagination.currentPage = !isNaN(page) && page > 0 ? page : 1;
  }
  // 2. Tính số sản phẩm bỏ qua cho MongoDB query
  objectPagination.skipItems = (objectPagination.currentPage - 1) * objectPagination.limitItems;

  // 3. Tính tổng số trang = tổng sản phẩm / số sản phẩm mỗi trang
  objectPagination.totalPages = Math.ceil(countProducts / objectPagination.limitItems);

  // 4. GIỚI HẠN SỐ Ô PHÂN TRANG HIỂN THỊ (TỐI ĐA 4 TRANG)
  const maxPagesToShow = 3;
  let startPage = 1;
  let endPage = objectPagination.totalPages;

  if (objectPagination.totalPages > maxPagesToShow) {
    const half = Math.floor(maxPagesToShow / 2); // half = 1

    // Tính dải trang xung quanh trang hiện tại
    startPage = objectPagination.currentPage - half;
    endPage = objectPagination.currentPage + half;

    // Xử lý chạm mốc đầu
    if (startPage < 1) {
      startPage = 1;
      endPage = maxPagesToShow;
    }

    // Xử lý chạm mốc cuối
    if (endPage > objectPagination.totalPages) {
      endPage = objectPagination.totalPages;
      startPage = objectPagination.totalPages - maxPagesToShow + 1;
    }
  }

  // Gán vào đối tượng trả về
  objectPagination.startPage = startPage;
  objectPagination.endPage = endPage;

  return objectPagination;
};