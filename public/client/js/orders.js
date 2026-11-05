document.querySelectorAll("[data-order-cancel]").forEach((button) => {
  button.addEventListener("click", () => {
    const form = button.closest("form");
    const reasons = [
      "Tìm được giá tốt hơn",
      "Cần thay đổi địa chỉ",
      "Không còn nhu cầu nữa",
      "Đặt nhầm sản phẩm",
      "Thời gian giao hàng chưa phù hợp",
      "Lý do khác"
    ];

    Swal.fire({
      title: "Bạn muốn hủy đơn hàng?",
      icon: "warning",
      html: '<p class="cancel-reason-hint">Vui lòng chọn lý do hủy đơn:</p><div class="cancel-reason-list" id="cancel-reason-list"></div><textarea id="cancel-reason-detail" class="cancel-reason-detail" maxlength="500" placeholder="Nhập lý do của bạn" style="display:none"></textarea>',
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Xác nhận hủy",
      cancelButtonText: "Quay lại",
      customClass: { popup: "cancel-order-popup", actions: "cancel-order-actions" },
      didOpen: () => {
        const list = document.querySelector("#cancel-reason-list");
        reasons.forEach((reason, index) => {
          const label = document.createElement("label");
          label.className = "cancel-reason-option";
          const radio = document.createElement("input");
          radio.type = "radio";
          radio.name = "cancel-reason-choice";
          radio.value = String(index);
          radio.className = "cancel-reason-radio";
          const text = document.createElement("span");
          text.textContent = reason;
          label.append(radio, text);
          list.appendChild(label);
        });

        list.addEventListener("change", (event) => {
          const detail = document.querySelector("#cancel-reason-detail");
          const isOther = event.target.value === String(reasons.length - 1);
          list.querySelectorAll(".cancel-reason-option").forEach(option => option.classList.remove("is-selected"));
          event.target.closest(".cancel-reason-option").classList.add("is-selected");
          detail.style.display = isOther ? "block" : "none";
          if (!isOther) detail.value = "";
        });
      },
      preConfirm: () => {
        const selected = document.querySelector('input[name="cancel-reason-choice"]:checked');
        if (!selected) {
          Swal.showValidationMessage("Vui lòng chọn lý do hủy đơn.");
          return false;
        }
        const reason = reasons[Number(selected.value)];
        const detail = document.querySelector("#cancel-reason-detail").value.trim();
        if (reason === "Lý do khác" && !detail) {
          Swal.showValidationMessage("Vui lòng nhập lý do hủy.");
          return false;
        }
        return { reason, detail };
      }
    }).then((result) => {
      if (!result.isConfirmed) return;

      const fields = {
        cancelReason: result.value.reason,
        cancelReasonDetail: result.value.detail
      };
      Object.entries(fields).forEach(([name, value]) => {
        let input = form.querySelector(`[name="${name}"]`);
        if (!input) {
          input = document.createElement("input");
          input.type = "hidden";
          input.name = name;
          form.appendChild(input);
        }
        input.value = value;
      });
      form.submit();
    });
  });
});
