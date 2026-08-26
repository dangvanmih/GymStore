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