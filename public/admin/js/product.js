// Xử lý logic thay đổi trạng thái sản phẩm
const buttonsChangeStatus = document.querySelectorAll("[button-change-status]");
if (buttonsChangeStatus.length > 0) {
  const formChangeStatus = document.querySelector("#form-change-status");

  const path = formChangeStatus.getAttribute("data-path");

  buttonsChangeStatus.forEach(button => {
    button.addEventListener("click", () => {
      const statusCurrent = button.getAttribute("data-status");
      const id = button.getAttribute("data-id")

      let statusChange = statusCurrent == "active" ? "inactive" : "active";
      const action = path + `/${statusChange}/${id}?_method=PATCH`;
      formChangeStatus.action = action;
      formChangeStatus.submit();
    })
  })
};

// xử lý logic nút checkbox
const checkBoxMulti = document.querySelector("[checkbox-multi]");
if (checkBoxMulti) {
  const inputCheckAll = checkBoxMulti.querySelector("input[name='checkall']");
  const inputcheckbox = checkBoxMulti.querySelectorAll("input[name='id']");

  inputCheckAll.addEventListener("click", () => {
    if (inputCheckAll.checked) {
      inputcheckbox.forEach(checkbox => {
        checkbox.checked = true
      });
    }
    else {
      inputcheckbox.forEach(checkbox => {
        checkbox.checked = false;
      });
    }
  });

  inputcheckbox.forEach(checkbox => {
    checkbox.addEventListener("click", () => {
      countChecked = checkBoxMulti.querySelectorAll("input[name='id']:checked").length;

      if (inputcheckbox.length == countChecked) {
        inputCheckAll.checked = true
      }
      else {
        inputCheckAll.checked = false
      }
    })
  })
};

// Xử lý thay đổi trạng thái nhiều sản phẩm
const formChangeMulti = document.querySelector("[form-change-multi]");

if (formChangeMulti) {
  formChangeMulti.addEventListener("submit", (e) => {
    e.preventDefault();

    // 1. Lấy giá trị của action chọn từ select
    const selectType = formChangeMulti.querySelector("select[name='type']");
    const typeChange = selectType ? selectType.value : "";

    // 2. Lấy danh sách checkbox đã check
    const checkBoxMulti = document.querySelector("[checkbox-multi]");
    const checkboxChecked = checkBoxMulti ? checkBoxMulti.querySelectorAll("input[name='id']:checked") : [];

    // BƯỚC CHECK 1: Kiểm tra xem đã chọn hành động chưa
    if (!typeChange) {
      alert("Vui lòng chọn một hành động!");
      return;
    }

    // BƯỚC CHECK 2: Kiểm tra xem đã chọn ít nhất 1 sản phẩm chưa
    if (checkboxChecked.length === 0) {
      alert("Vui lòng chọn ít nhất một sản phẩm!");
      return;
    }

    // BƯỚC CHECK 3 (Nâng cao): Xác nhận trước khi xóa nhiều
    if (typeChange === "delete-all") {
      const isConfirm = confirm(`Bạn có chắc chắn muốn xóa ${checkboxChecked.length} sản phẩm đã chọn?`);
      if (!isConfirm) return;
    }

    // 3. Gom danh sách ID
    const ids = Array.from(checkboxChecked).map(input => input.value);
    const inputIds = formChangeMulti.querySelector("input[name='ids']");

    if (inputIds) {
      inputIds.value = ids.join(", "); // Gán chuỗi "id1, id2, id3"
    }

    // 4. Submit form
    formChangeMulti.submit();
  });
}