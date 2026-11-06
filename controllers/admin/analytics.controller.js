const Order = require("../../models/order.model");
const ExcelJS = require("exceljs");

const DAY_MS = 24 * 60 * 60 * 1000;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

const getDefaultRange = () => {
  const today = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const from = new Date(`${today}T00:00:00Z`);
  from.setUTCDate(from.getUTCDate() - 6);
  return { from: from.toISOString().slice(0, 10), to: today };
};

const getDateBounds = (from, to) => ({
  start: new Date(`${from}T00:00:00+07:00`),
  end: new Date(new Date(`${to}T00:00:00+07:00`).getTime() + DAY_MS)
});

const validateRange = (from, to) => {
  if (!datePattern.test(from || "") || !datePattern.test(to || "")) return false;
  const fromDate = new Date(`${from}T00:00:00Z`);
  const toDate = new Date(`${to}T00:00:00Z`);
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) return false;
  return fromDate.toISOString().slice(0, 10) === from &&
    toDate.toISOString().slice(0, 10) === to && from <= to;
};

const getReportData = async (from, to) => {
  const { start, end } = getDateBounds(from, to);
  const fromUtc = new Date(`${from}T00:00:00Z`);
  const toUtc = new Date(`${to}T00:00:00Z`);
  const daily = (toUtc - fromUtc) / DAY_MS < 31;
  const format = daily ? "%Y-%m-%d" : "%Y-%m";

  const [result] = await Order.aggregate([
    { $match: { status: "delivered", createdAt: { $gte: start, $lt: end } } },
    {
      $project: {
        createdAt: 1,
        revenue: { $ifNull: ["$total", 0] },
        costOfGoods: {
          $sum: {
            $map: {
              input: { $ifNull: ["$products", []] },
              as: "product",
              in: {
                $multiply: [
                  { $ifNull: ["$$product.costPrice", 0] },
                  { $ifNull: ["$$product.quantity", 0] }
                ]
              }
            }
          }
        }
      }
    },
    {
      $facet: {
        summary: [{ $group: { _id: null, revenue: { $sum: "$revenue" }, costOfGoods: { $sum: "$costOfGoods" } } }],
        timeline: [
          {
            $group: {
              _id: { $dateToString: { date: "$createdAt", format, timezone: "Asia/Ho_Chi_Minh" } },
              revenue: { $sum: "$revenue" },
              costOfGoods: { $sum: "$costOfGoods" }
            }
          },
          { $sort: { _id: 1 } }
        ]
      }
    }
  ]);

  const summary = result?.summary?.[0] || {};
  const values = new Map((result?.timeline || []).map(item => [item._id, item]));
  const labels = [];
  const revenue = [];
  const costOfGoods = [];
  if (daily) {
    for (let day = new Date(fromUtc); day <= toUtc; day.setUTCDate(day.getUTCDate() + 1)) {
      const key = day.toISOString().slice(0, 10);
      const item = values.get(key);
      labels.push(key);
      revenue.push(item?.revenue || 0);
      costOfGoods.push(item?.costOfGoods || 0);
    }
  } else {
    const month = new Date(Date.UTC(fromUtc.getUTCFullYear(), fromUtc.getUTCMonth(), 1));
    const lastMonth = new Date(Date.UTC(toUtc.getUTCFullYear(), toUtc.getUTCMonth(), 1));
    while (month <= lastMonth) {
      const key = `${month.getUTCFullYear()}-${String(month.getUTCMonth() + 1).padStart(2, "0")}`;
      const item = values.get(key);
      labels.push(key);
      revenue.push(item?.revenue || 0);
      costOfGoods.push(item?.costOfGoods || 0);
      month.setUTCMonth(month.getUTCMonth() + 1);
    }
  }

  return {
    labels,
    revenue,
    costOfGoods,
    grossProfit: revenue.map((value, index) => value - costOfGoods[index]),
    granularity: daily ? "day" : "month",
    summary: {
      revenue: summary.revenue || 0,
      costOfGoods: summary.costOfGoods || 0,
      grossProfit: (summary.revenue || 0) - (summary.costOfGoods || 0)
    }
  };
};

module.exports.index = async (req, res, next) => {
  try {
    const defaultRange = getDefaultRange();
    const data = await getReportData(defaultRange.from, defaultRange.to);
    res.render("admin/pages/analytics/index", { pageTitle: "Báo cáo doanh thu", defaultRange, summary: data.summary });
  } catch (error) {
    next(error);
  }
};

module.exports.data = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    if (!validateRange(from, to)) {
      return res.status(400).json({ message: "Vui lòng chọn khoảng ngày hợp lệ." });
    }
    res.json(await getReportData(from, to));
  } catch (error) {
    next(error);
  }
};

module.exports.export = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    if (!validateRange(from, to)) {
      return res.status(400).json({ message: "Vui lòng chọn khoảng ngày hợp lệ." });
    }

    const report = await getReportData(from, to);
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "GymStore";
    workbook.created = new Date();

    const summarySheet = workbook.addWorksheet("Tổng hợp");
    summarySheet.columns = [
      { header: "Chỉ số", key: "label", width: 32 },
      { header: "Giá trị", key: "value", width: 26 }
    ];
    summarySheet.addRows([
      { label: "Khoảng thời gian", value: `${from} đến ${to}` },
      { label: "Trạng thái đơn", value: "Đã giao" },
      { label: "Tổng doanh thu (VNĐ)", value: report.summary.revenue },
      { label: "Giá vốn hàng đã bán (VNĐ)", value: report.summary.costOfGoods },
      { label: "Lợi nhuận gộp (VNĐ)", value: report.summary.grossProfit }
    ]);

    const detailSheet = workbook.addWorksheet(report.granularity === "day" ? "Theo ngày" : "Theo tháng");
    detailSheet.columns = [
      { header: report.granularity === "day" ? "Ngày" : "Tháng", key: "period", width: 18 },
      { header: "Doanh thu (VNĐ)", key: "revenue", width: 24 },
      { header: "Giá vốn (VNĐ)", key: "costOfGoods", width: 24 },
      { header: "Lợi nhuận gộp (VNĐ)", key: "grossProfit", width: 27 }
    ];
    report.labels.forEach((period, index) => detailSheet.addRow({
      period,
      revenue: report.revenue[index],
      costOfGoods: report.costOfGoods[index],
      grossProfit: report.grossProfit[index]
    }));

    [summarySheet, detailSheet].forEach(sheet => {
      sheet.views = [{ state: "frozen", ySplit: 1 }];
      sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
      sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF26372D" } };
    });
    ["B4", "B5", "B6"].forEach(cell => { summarySheet.getCell(cell).numFmt = '#,##0 "₫"'; });
    ["A4", "A5", "A6"].forEach(cell => { summarySheet.getCell(cell).font = { bold: true }; });
    detailSheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        for (let column = 2; column <= 4; column++) row.getCell(column).numFmt = '#,##0 "₫"';
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `bao-cao-doanh-thu-${from}-${to}.xlsx`;
    res.set({
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`
    });
    res.send(Buffer.from(buffer));
  } catch (error) {
    next(error);
  }
};
