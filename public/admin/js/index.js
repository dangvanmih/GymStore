// xử lý sự kiện click vào nút toggle sidebar
document.addEventListener("DOMContentLoaded", function () {
  const sidebarToggleBtn = document.getElementById("sidebarToggle");
  const sider = document.querySelector(".sider");

  // Đọc trạng thái lưu từ localStorage
  const isCollapsed = localStorage.getItem("sidebarCollapsed") === "true";
  if (isCollapsed && sider) {
    sider.classList.add("collapsed");
  }

  if (sidebarToggleBtn && sider) {
    sidebarToggleBtn.addEventListener("click", function () {
      sider.classList.toggle("collapsed");

      // Lưu trạng thái vào localStorage để giữ giao diện khi reload
      const collapsedState = sider.classList.contains("collapsed");
      localStorage.setItem("sidebarCollapsed", collapsedState);
    });
  }
});

// xử lý sự kiện click vào menu sẽ active menu đó.
document.addEventListener("DOMContentLoaded", () => {
  const currentUrl = window.location.pathname;
  const navLinks = document.querySelectorAll(".sider .nav-link");

  navLinks.forEach((link) => {
    const linkPath = link.getAttribute("href");

    // Xóa active cũ
    link.classList.remove("active");

    // Kiểm tra nếu URL hiện tại chứa href của thẻ a
    if (linkPath && currentUrl.startsWith(linkPath)) {
      // Trường hợp đặc biệt cho trang Dashboard để tránh khớp với mọi đường dẫn /admin
      if (linkPath.endsWith("/dashboard") && currentUrl !== linkPath) {
        return;
      }
      link.classList.add("active");
    }
  });
});

// xử lý sự kiện click vào nút lọc trạng thái sản phẩm
const buttonStatus = document.querySelectorAll('[button-status]');
if (buttonStatus.length > 0) {
  let url = new URL(window.location.href);
  buttonStatus.forEach((button) => {
    button.addEventListener("click", function () {
      const status = button.getAttribute("button-status");
      if (status) {
        url.searchParams.set("status", status);
      }
      else {
        url.searchParams.delete("status");
      }
      window.location.href = url.toString();
    })
  })
};

// Xử lý tìm kiếm sản phẩm
const searchForm = document.querySelector("#form-search");
if (searchForm) {
  let url = new URL(window.location.href);
  searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const searchValue = e.target.elements.keyword.value.trim();
    if (searchValue) {
      url.searchParams.set("keyword", searchValue);
    }
    else {
      url.searchParams.delete("keyword");
    }
    window.location.href = url.toString();
  });

};

// Xử lý phân trang
const buttonPagination = document.querySelectorAll('[button-pagination]');
if (buttonPagination.length > 0) {
  let url = new URL(window.location.href);
  buttonPagination.forEach((button) => {
    button.addEventListener("click", function () {
      const page = button.getAttribute("button-pagination");
      if (page) {
        url.searchParams.set("page", page);
      }
      window.location.href = url.toString();
    }
    )
  })
};

// Xử lý ẩn thông báo Flash (Alert)
const showAlert = document.querySelector("[show-alert]");
if (showAlert) {
  const time = parseInt(showAlert.getAttribute("data-time")) || 3000;
  const closeAlert = showAlert.querySelector("[close-alert]");

  // Tự động ẩn sau khoảng thời gian 'data-time'
  setTimeout(() => {
    showAlert.classList.add("alert-hidden");
  }, time);

  // Nút đóng thủ công
  if (closeAlert) {
    closeAlert.addEventListener("click", () => {
      showAlert.classList.add("alert-hidden");
    });
  }
};

// Xử lý upload preview ảnh sản phẩm
document.addEventListener("DOMContentLoaded", () => {
  const uploadImageWrapper = document.querySelector("[upload-image]");

  if (uploadImageWrapper) {
    const uploadImageInput = uploadImageWrapper.querySelector("[upload-image-input]");
    const uploadImagePreview = uploadImageWrapper.querySelector("[upload-image-preview]");
    const uploadPlaceholder = uploadImageWrapper.querySelector("[upload-placeholder]");
    const uploadImageRemove = uploadImageWrapper.querySelector("[upload-image-remove]");
    
    // Khối preview chứa placeholder & img
    const uploadPreviewWrapper = uploadImageWrapper.querySelector(".upload-image-preview");

    // Hàm chung xử lý hiển thị preview
    const handlePreview = (file) => {
      if (file && file.type.startsWith("image/")) {
        uploadImagePreview.src = URL.createObjectURL(file);
        uploadImagePreview.classList.remove("d-none");

        if (uploadImageRemove) {
          uploadImageRemove.classList.remove("d-none");
        }
        if (uploadPlaceholder) {
          uploadPlaceholder.classList.add("d-none");
        }
      }
    };

    if (uploadImageInput && uploadImagePreview && uploadPreviewWrapper) {
      // 1. Chọn file truyền thống bằng input
      uploadImageInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        handlePreview(file);
      });

      // 2. Xử lý Drag & Drop CHỈ TRÊN KHUNG PREVIEW
      uploadPreviewWrapper.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadPreviewWrapper.classList.add("dragover");
      });

      uploadPreviewWrapper.addEventListener("dragleave", (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadPreviewWrapper.classList.remove("dragover");
      });

      uploadPreviewWrapper.addEventListener("drop", (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadPreviewWrapper.classList.remove("dragover");

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
          const file = files[0];
          
          // Gán file vừa thả vào input file để gửi đi khi submit form
          uploadImageInput.files = files;

          // Hiển thị preview
          handlePreview(file);
        }
      });

      // 3. Nút Gỡ/Xóa ảnh
      if (uploadImageRemove) {
        uploadImageRemove.addEventListener("click", () => {
          uploadImageInput.value = "";
          uploadImagePreview.src = "";
          uploadImagePreview.classList.add("d-none");
          uploadImageRemove.classList.add("d-none");

          if (uploadPlaceholder) {
            uploadPlaceholder.classList.remove("d-none");
          }
        });
      }
    }
  }
});

// xử lý sự kiện sắp xếp sản phẩm
const sort = document.querySelector("[sort]");
if (sort) {
  let url = new URL(window.location.href);
  const sortSelect = sort.querySelector("[sort-select]");
  const btnClearSort = sort.querySelector("[sort-clear]");

  sortSelect.addEventListener("change", (e) => {
    const value = e.target.value;
    const [sortKey, sortValue] = value.split("-");
    if (sortKey && sortValue) {
      url.searchParams.set("sortKey", sortKey);
      url.searchParams.set("sortValue", sortValue);

      window.location.href = url.href;
    };
  });

  btnClearSort.addEventListener("click", () => {
    url.searchParams.delete("sortKey");
    url.searchParams.delete("sortValue");
    window.location.href = url.href;
  })

  const sortKey = url.searchParams.get("sortKey");
  const sortValue = url.searchParams.get("sortValue");
  if (sortKey && sortValue) {
    const value = `${sortKey}-${sortValue}`;
    sortSelect.value = value;
  }
};