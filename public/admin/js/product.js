// Xử lý logic thay đổi trạng thái sản phẩm
const buttonsChangeStatus = document.querySelectorAll("[button-change-status]");
const formChangeStatus = document.querySelector("#form-change-status");
if (buttonsChangeStatus.length > 0 && formChangeStatus) {

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


// xử lý xóa sản phẩm
const buttonDelete = document.querySelectorAll("[button-delete]");

if (buttonDelete.length > 0) {
  const formDeleteItem = document.querySelector("#form-delete-item");
  const path = formDeleteItem.getAttribute("data-path");

  buttonDelete.forEach(button => {
    button.addEventListener("click", () => {
      const isConfim = confirm("Bạn có chắc muốn xóa sản phẩm này không?");

      if (isConfim) {
        const id = button.getAttribute("data-id");

        const action = `${path}/${id}?_method=DELETE`;
        console.log(action);

        formDeleteItem.action = action;

        formDeleteItem.submit();
      }
    });
  });
};



