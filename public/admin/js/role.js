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
        text: "Hành động này sẽ xóa tạm thời nhóm quyền và có thể khôi phục!",
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
};


// permission
const tablePermissions = document.querySelector("[table-permissions]");
if (tablePermissions) {
  const btnSubmit = document.querySelector("[button-submit]");
  btnSubmit.addEventListener("click", () => {
    let permissions = [];

    const rows = tablePermissions.querySelectorAll("[data-name]");

    rows.forEach(row => {

      const name = row.getAttribute("data-name");
      const inputs = row.querySelectorAll("input");

      if (name == "id") {
        inputs.forEach(input => {
          const id = input.value;
          permissions.push({
            id: id,
            permissions: []
          });
        })
      } else {
        inputs.forEach((input, index) => {
          const checked = input.checked;
          if (checked) {
            // dựa vào chỉ số index bên trên để biết cái data-name nào được tích để gán cho cái name = id
            permissions[index].permissions.push(name)
          }
        })
      };
    })

    if (permissions.length > 0) {
      const formChangePermission = document.querySelector(
        "#form-change-permissions"
      );

      const inputPermission = formChangePermission.querySelector(
        "input[name='permissions']"
      );

      inputPermission.value = JSON.stringify(permissions);

      formChangePermission.submit();
    }
  });
};


// hiển thị giá trị permission
const dataRecords = document.querySelector("[data-records]");
if (dataRecords) {

  const records = JSON.parse(dataRecords.getAttribute("data-records"))

  const tablePermissions = document.querySelector("[table-permissions]");

  records.forEach((record, index) => {
    const permission = record.permissions;

    permission.forEach(permission => {
      const row = tablePermissions.querySelector(
        `[data-name="${permission}"]`
      );

      if (row) {
        const input = row.querySelectorAll("input")[index];

        if (input) {
          input.checked = true;
        }
      }
    });
  });
};