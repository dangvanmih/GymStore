(() => {
  const button = document.getElementById("place-order-submit");
  const cod = document.getElementById("payment-cod");
  const vnpay = document.getElementById("payment-vnpay");

  if (!button || !cod || !vnpay) return;

  const updateSubmitLabel = () => {
    button.textContent = vnpay.checked ? "Thanh toán ngay" : "Gửi yêu cầu xác nhận";
  };

  cod.addEventListener("change", updateSubmitLabel);
  vnpay.addEventListener("change", updateSubmitLabel);
  updateSubmitLabel();
})();
