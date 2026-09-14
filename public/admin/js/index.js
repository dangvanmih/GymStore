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

// xử lý sự kiện click vào nút lọc trạng thái sản phẩm
const buttonStatus = document.querySelectorAll('[button-status]');

if (buttonStatus.length > 0) {
  let url = new URL(window.location.href);
  buttonStatus.forEach((button) => {
    button.addEventListener("click", function () {
      const status = button.getAttribute("button-status");
      if(status) {
        url.searchParams.set("status", status);
      }
      else {
        url.searchParams.delete("status");
      }
      window.location.href = url.toString();
    })
  })
}