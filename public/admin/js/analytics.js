(() => {
  const page = document.querySelector(".dashboard-page[data-default-from]");
  const canvas = document.getElementById("analyticsChart");
  const filter = document.getElementById("analyticsDateFilter");
  const fromInput = document.getElementById("analyticsFrom");
  const toInput = document.getElementById("analyticsTo");
  const message = document.getElementById("analyticsChartMessage");
  const exportButton = document.getElementById("analyticsExportButton");
  if (!page || !canvas || !filter || !fromInput || !toInput || !window.Chart) return;

  const formatter = new Intl.NumberFormat("vi-VN");
  fromInput.value = page.dataset.defaultFrom;
  toInput.value = page.dataset.defaultTo;

  const chart = new Chart(canvas, {
    type: "bar",
    data: {
      labels: [],
      datasets: [
        { label: "Doanh thu", data: [], backgroundColor: "rgba(102, 139, 54, 0.84)", borderRadius: 5, borderSkipped: false },
        { label: "Giá vốn", data: [], backgroundColor: "rgba(211, 154, 69, 0.84)", borderRadius: 5, borderSkipped: false },
        { label: "Lợi nhuận gộp", data: [], backgroundColor: "rgba(71, 127, 104, 0.88)", borderRadius: 5, borderSkipped: false }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: context => ` ${context.dataset.label}: ${formatter.format(context.raw)} ₫` } }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: "#778178" } },
        y: { beginAtZero: true, grid: { color: "#edf0eb" }, ticks: { color: "#778178", callback: value => formatter.format(value) } }
      }
    }
  });

  const loadData = async () => {
    const from = fromInput.value;
    const to = toInput.value;
    if (!from || !to) return;
    if (from > to) {
      message.textContent = "Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.";
      return;
    }

    message.textContent = "Đang tải dữ liệu...";
    try {
      const params = new URLSearchParams({ from, to });
      const response = await fetch(`/admin/analytics/data?${params}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Không thể tải dữ liệu báo cáo.");

      chart.data.labels = data.labels.map(label => {
        const [year, month, day] = label.split("-");
        return day ? `${day}-${month}-${year}` : `${month}-${year}`;
      });
      chart.data.datasets[0].data = data.revenue;
      chart.data.datasets[1].data = data.costOfGoods;
      chart.data.datasets[2].data = data.grossProfit;
      chart.update();

      document.querySelectorAll("[data-analytics-metric]").forEach(element => {
        const value = data.summary[element.dataset.analyticsMetric] || 0;
        element.textContent = `${formatter.format(value)} ₫`;
      });
      message.textContent = data.granularity === "day" ? "Đang hiển thị dữ liệu theo ngày." : "Đang hiển thị dữ liệu theo tháng.";
    } catch (error) {
      message.textContent = error.message || "Không thể tải dữ liệu báo cáo.";
    }
  };

  filter.addEventListener("submit", event => {
    event.preventDefault();
    loadData();
  });
  exportButton?.addEventListener("click", async () => {
    const from = fromInput.value;
    const to = toInput.value;
    if (!from || !to || from > to) {
      message.textContent = "Vui lòng chọn khoảng ngày hợp lệ trước khi xuất báo cáo.";
      return;
    }

    exportButton.disabled = true;
    message.textContent = "Đang tạo file Excel...";
    try {
      const params = new URLSearchParams({ from, to });
      const response = await fetch(`/admin/analytics/export?${params}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Không thể xuất báo cáo.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `bao-cao-doanh-thu-${from}-${to}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      message.textContent = "Đã tải báo cáo Excel.";
    } catch (error) {
      message.textContent = error.message || "Không thể xuất báo cáo.";
    } finally {
      exportButton.disabled = false;
    }
  });
  loadData();
})();
