document.addEventListener("DOMContentLoaded", () => {
  const checkboxes = document.querySelectorAll(".filter-checkbox");
  const productListRow = document.querySelector(".product-list-row");

  async function sendAjaxFilter(url) {
    try {
      let response = await fetch(url, {
        headers: {
          "X-Requested-With": "XMLHttpRequest"
        }
      });
      let data = await response.json();
      
      if (data.code === 200) {
        if (productListRow) {
          productListRow.innerHTML = data.html;
        }
        window.history.pushState({}, "", url);
      }
    } catch (error) {
      console.log("Lỗi khi lọc sản phẩm:", error);
    }
  }

  checkboxes.forEach(checkbox => {
    checkbox.addEventListener("change", () => {
      let url = new URL(window.location.href);
      let name = checkbox.name;
      let value = checkbox.value;

      if (checkbox.checked) {
        url.searchParams.set(name, value);
      } else {
        url.searchParams.delete(name);
      }

      sendAjaxFilter(url.href);
    });
  });

  // Giữ trạng thái checked khi load lại trang bằng URL
  let urlParams = new URLSearchParams(window.location.search);
  checkboxes.forEach(checkbox => {
    if (urlParams.get(checkbox.name) === checkbox.value) {
      checkbox.checked = true;
    }
  });

  // Xử lý nút xóa "×" trên thẻ lọc
  const removeFilters = document.querySelectorAll(".remove-filter");
  removeFilters.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      let type = btn.getAttribute("data-type");
      let url = new URL(window.location.href);
      
      url.searchParams.delete(type);
      sendAjaxFilter(url.href);
    });
  });
});