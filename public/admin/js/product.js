// xử lý logic nút checkbox
document.addEventListener("DOMContentLoaded", () => {
  const checkBoxMulti = document.querySelector("[checkbox-multi]");

  if (!checkBoxMulti) return;

  const inputCheckAll = checkBoxMulti.querySelector(
    "input[name='checkall']"
  );

  const inputCheckbox = checkBoxMulti.querySelectorAll(
    "input[name='id']"
  );

  if (!inputCheckAll) return;

  inputCheckAll.addEventListener("change", () => {
    inputCheckbox.forEach((checkbox) => {
      checkbox.checked = inputCheckAll.checked;
    });
  });

  inputCheckbox.forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const countChecked = checkBoxMulti.querySelectorAll(
        "input[name='id']:checked"
      ).length;

      inputCheckAll.checked =
        inputCheckbox.length > 0 &&
        countChecked === inputCheckbox.length;
    });
  });
});

// xử lý xóa role
const buttonDelete = document.querySelectorAll("[button-delete]");

if (buttonDelete.length > 0) {
  const formDeleteItem = document.querySelector("#form-delete-item");
  const path = formDeleteItem.getAttribute("data-path");

  buttonDelete.forEach(button => {
    button.addEventListener("click", () => {
      // Gọi SweetAlert2 thay cho confirm() mặc định
      Swal.fire({
        title: "Bạn có chắc chắn muốn xóa?",
        text: "Hành động này sẽ xóa tạm thời sản phẩm và có thể khôi phục!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444", // Màu đỏ cho nút xóa
        cancelButtonColor: "#334155",  // Màu xám tối cho nút hủy
        confirmButtonText: "Đồng ý xóa",
        cancelButtonText: "Hủy bỏ",
        background: "#131722",         // Nền khớp với card Dark Mode
        color: "#f8fafc",
        customClass: {
          popup: 'sw2-compact-popup' // Áp dụng class thu nhỏ
        }             
      }).then((result) => {
        if (result.isConfirmed) {
          const id = button.getAttribute("data-id");

          const action = `${path}/${id}?_method=DELETE`;
          console.log(action);

          formDeleteItem.action = action;
          formDeleteItem.submit();
        }
      });
    });
  });
}

// xử lý thêm sizeCreate
document.addEventListener("DOMContentLoaded", () => {
  const hasVariantsCheckbox = document.querySelector("#hasVariants");
  const singleStockWrapper = document.querySelector("#single-stock-wrapper");
  const variantsWrapper = document.querySelector("#variants-wrapper");
  const variantsList = document.querySelector("#variants-list");
  const btnAddVariant = document.querySelector("#btn-add-variant");

  if (hasVariantsCheckbox) {
    let variantIndex = 0;

    // Tạo 1 dòng nhập Size & Stock
    const createVariantRow = (index) => {
      const div = document.createElement("div");
      div.className = "row g-2 mb-2 align-items-center variant-item";
      div.innerHTML = `
        <div class="col-5">
          <input type="text" name="variants[${index}][size]" class="form-control form-control-dark" placeholder="Kích cỡ (VD: S, M, L)" required>
        </div>
        <div class="col-5">
          <input type="number" name="variants[${index}][stock]" class="form-control form-control-dark" placeholder="Số lượng tồn kho" min="0" value="0" required>
        </div>
        <div class="col-2 text-center">
          <button type="button" class="btn btn-outline-danger btn-sm btn-remove-variant" title="Xóa">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      `;

      // Nút xóa dòng size
      div.querySelector(".btn-remove-variant").addEventListener("click", () => {
        div.remove();
      });

      return div;
    };

    // Lắng nghe sự kiện bật/tắt công tắc "Có phân loại Size"
    hasVariantsCheckbox.addEventListener("change", (e) => {
      const isChecked = e.target.checked;
      if (isChecked) {
        singleStockWrapper.classList.add("d-none");
        variantsWrapper.classList.remove("d-none");

        if (variantsList.children.length === 0) {
          variantsList.appendChild(createVariantRow(variantIndex++));
        }
      } else {
        singleStockWrapper.classList.remove("d-none");
        variantsWrapper.classList.add("d-none");
      }
    });

    // Bấm nút "Thêm Size"
    btnAddVariant.addEventListener("click", () => {
      variantsList.appendChild(createVariantRow(variantIndex++));
    });
  }
});

// xử lý sizeEdit
document.addEventListener("DOMContentLoaded", () => {
  const hasVariantsCheckbox = document.querySelector("#hasVariants");
  const singleStockWrapper = document.querySelector("#single-stock-wrapper");
  const variantsWrapper = document.querySelector("#variants-wrapper");
  const variantsList = document.querySelector("#variants-list");

  if (hasVariantsCheckbox) {
    // Đếm số lượng dòng đang có để đặt index tiếp theo
    let variantIndex = variantsList ? variantsList.children.length : 0;

    // Gắn sự kiện xóa cho các nút Xóa đã có sẵn từ Server
    const bindRemoveButtons = () => {
      const removeButtons = document.querySelectorAll(".btn-remove-variant");
      removeButtons.forEach((btn) => {
        // Tránh gắn trùng lặp sự kiện click
        if (!btn.dataset.hasListener) { // kiểm tra cái nút btn này đã có cái attribute là has-listener chưa
          btn.dataset.hasListener = "true"; // chưa có thì gán = true
          btn.addEventListener("click", (e) => {
            const itemRow = e.target.closest(".variant-item"); //Đi ngược từ thẻ vừa click lên trên để tìm thẻ cha gần nhất
            if (itemRow) {
              itemRow.remove();
            }
          });
        }
      });
    };

    // Khởi tạo gắn listener cho các dòng render từ Pug
    bindRemoveButtons();

    // Sự kiện khi công tắc "Có phân loại Size" thay đổi
    hasVariantsCheckbox.addEventListener("change", (e) => {
      const isChecked = e.target.checked;
      if (isChecked) {
        singleStockWrapper.classList.add("d-none");
        variantsWrapper.classList.remove("d-none");

        if (variantsList.children.length === 0) {
          variantsList.appendChild(createVariantRow(variantIndex++));
        }
      } else {
        singleStockWrapper.classList.remove("d-none");
        variantsWrapper.classList.add("d-none");
      }
    });
  }
});