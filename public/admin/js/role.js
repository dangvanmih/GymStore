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
    const idRow = tablePermissions.querySelector('[data-name="id"]');
    const roleIdInputs = Array.from(idRow.querySelectorAll("input"));
    const permissions = roleIdInputs.map(input => ({
      id: input.value,
      permissions: []
    }));
    const permissionsById = new Map(permissions.map(item => [item.id, item]));

    tablePermissions.querySelectorAll("input[type='checkbox']:checked").forEach(input => {
      const rowInputs = Array.from(input.closest("tr").querySelectorAll("input[type='checkbox']"));
      const columnIndex = rowInputs.indexOf(input);
      const rolePermissions = permissionsById.get(input.dataset.roleId)
        || permissionsById.get(roleIdInputs[columnIndex]?.value);
      if (rolePermissions && input.value) {
        rolePermissions.permissions.push(input.value);
      }
    });

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

  records.forEach(record => {
    const roleId = record._id || record.id;
    (record.permissions || []).forEach(permission => {
      const input = tablePermissions.querySelector(
        `input[type="checkbox"][data-role-id="${roleId}"][value="${permission}"]`
      );
      if (input) input.checked = true;
    });
  });
};
