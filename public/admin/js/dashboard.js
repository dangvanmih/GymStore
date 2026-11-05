(() => {
  const dashboard = document.querySelector(".dashboard-page");
  const canvas = document.getElementById("dashboardChart");
  const filter = document.getElementById("dashboardDateFilter");
  const fromInput = document.getElementById("dashboardFrom");
  const toInput = document.getElementById("dashboardTo");
  const message = document.getElementById("dashboardChartMessage");
  if (!dashboard || !canvas || !filter || !fromInput || !toInput || !window.Chart) return;

  const formatter = new Intl.NumberFormat("vi-VN");
  fromInput.value = dashboard.dataset.defaultFrom;
  toInput.value = dashboard.dataset.defaultTo;

  const chart = new Chart(canvas, {
    type: "bar",
    data: {
      labels: [],
      datasets: [
        {
          label: "Doanh thu (₫)", data: [], yAxisID: "revenue",
          borderColor: "#668b36", backgroundColor: "rgba(102, 139, 54, 0.82)",
          borderRadius: 5, borderSkipped: false, maxBarThickness: 38,
          categoryPercentage: 0.72, barPercentage: 0.86
        },
        {
          label: "Số đơn", data: [], yAxisID: "orders",
          borderColor: "#a4b98a", backgroundColor: "rgba(164, 185, 138, 0.9)",
          borderRadius: 5, borderSkipped: false, maxBarThickness: 38,
          categoryPercentage: 0.72, barPercentage: 0.86
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => context.dataset.yAxisID === "revenue"
              ? ` ${context.dataset.label}: ${formatter.format(context.raw)} ₫`
              : ` ${context.dataset.label}: ${formatter.format(context.raw)}`
          }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: "#778178" } },
        revenue: {
          type: "linear", position: "left", beginAtZero: true,
          grid: { color: "#edf0eb" },
          ticks: { color: "#778178", callback: (value) => formatter.format(value) }
        },
        orders: {
          type: "linear", position: "right", beginAtZero: true,
          grid: { drawOnChartArea: false },
          ticks: { color: "#778178", precision: 0 }
        }
      }
    }
  });

  const loadChartData = async () => {
    const from = fromInput.value;
    const to = toInput.value;
    if (!from || !to) return;
    if (from > to) {
      message.textContent = "Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.";
      return;
    }

    message.textContent = "Đang tải dữ liệu...";
    const params = new URLSearchParams({ from, to });
    try {
      const response = await fetch(`/admin/dashboard/chart-data?${params}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Không thể tải dữ liệu biểu đồ.");

      chart.data.labels = data.labels.map((label) => {
        const [year, month, day] = label.split("-");
        return day ? `${day}-${month}-${year}` : `${month}-${year}`;
      });
      chart.data.datasets[0].data = data.revenue;
      chart.data.datasets[1].data = data.orders;
      chart.update();
      document.querySelectorAll("[data-dashboard-metric]").forEach((element) => {
        const value = data.summary[element.dataset.dashboardMetric] || 0;
        element.textContent = element.dataset.dashboardMetric === "revenue"
          ? `${formatter.format(value)} ₫`
          : formatter.format(value);
      });
      message.textContent = data.granularity === "day"
        ? "Đang hiển thị dữ liệu theo ngày."
        : "Đang hiển thị dữ liệu theo tháng.";
    } catch (error) {
      message.textContent = error.message || "Không thể tải dữ liệu biểu đồ.";
    }
  };

  filter.addEventListener("submit", (event) => {
    event.preventDefault();
    loadChartData();
  });
  loadChartData();
})();
