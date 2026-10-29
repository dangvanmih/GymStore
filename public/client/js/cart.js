document.addEventListener("DOMContentLoaded", () => {
  const formatMoney = value => `${Number(value || 0).toLocaleString("vi-VN")}đ`;
  const updateRow = async (row, input, requestedQuantity) => {
    const max = Number(input.max) || 99;
    const quantity = Math.max(1, Math.min(max, Number.parseInt(requestedQuantity, 10) || 1));
    input.value = quantity;
    row.querySelectorAll(".btn-quantity").forEach(button => button.disabled = true);

    try {
      const body = new URLSearchParams({
        productId: row.dataset.productId || input.getAttribute("product-id") || "",
        size: row.dataset.size || "",
        color: row.dataset.color || "",
        quantity: String(quantity)
      });
      const response = await fetch("/cart/update", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Không thể cập nhật giỏ hàng.");

      input.value = data.quantity;
      input.max = data.stock;
      row.querySelector(".item-total-price").textContent = formatMoney(data.itemTotal);
      document.querySelectorAll(".cart-total-all").forEach(element => element.textContent = formatMoney(data.totalAll));
      const badge = document.querySelector(".cart-badge");
      if (badge) badge.textContent = data.totalQuantity;
    } catch (error) {
      window.alert(error.message);
    } finally {
      row.querySelectorAll(".btn-quantity").forEach(button => button.disabled = false);
    }
  };

  document.querySelectorAll(".cart-item-row").forEach(row => {
    const input = row.querySelector(".input-quantity");
    if (!input) return;

    row.querySelectorAll(".btn-quantity").forEach(button => {
      button.addEventListener("click", () => {
        const change = button.dataset.action === "increase" ? 1 : -1;
        updateRow(row, input, Number(input.value) + change);
      });
    });
    input.addEventListener("change", () => updateRow(row, input, input.value));
  });
});
