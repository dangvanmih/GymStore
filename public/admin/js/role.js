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
        text: "Hành động này sẽ xóa vĩnh viễn nhóm quyền và không thể khôi phục!",
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