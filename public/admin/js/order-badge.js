document.addEventListener("DOMContentLoaded", () => {
  const orderLink = document.querySelector("[data-pending-orders-url]");
  const badge = document.querySelector("[data-pending-orders-badge]");
  if (!orderLink || !badge) return;

  const refreshPendingOrders = async () => {
    try {
      const response = await fetch(orderLink.dataset.pendingOrdersUrl, {
        headers: { Accept: "application/json" },
        credentials: "same-origin"
      });
      if (!response.ok) return;

      const { count } = await response.json();
      const pendingCount = Number(count) || 0;
      badge.dataset.count = pendingCount;
      badge.textContent = pendingCount;
      badge.hidden = pendingCount < 1;
      badge.setAttribute("aria-label", `${pendingCount} đơn chờ xác nhận`);
    } catch (error) {
      console.error("Không thể cập nhật số đơn chờ xác nhận:", error);
    }
  };

  refreshPendingOrders();
  window.setInterval(refreshPendingOrders, 15000);
});
