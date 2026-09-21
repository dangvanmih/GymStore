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