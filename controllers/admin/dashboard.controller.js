
const Order = require("../../models/order.model");
const DAY_MS = 24 * 60 * 60 * 1000;

const getDefaultRange = () => {
  const vnToday = new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const to = new Date(`${vnToday}T00:00:00Z`);
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - 6);
  return { from: from.toISOString().slice(0, 10), to: vnToday };
};

const getDateBounds = (from, to) => ({
  start: new Date(`${from}T00:00:00+07:00`),
  end: new Date(new Date(`${to}T00:00:00+07:00`).getTime() + DAY_MS)
});

const getSummary = async (start, end) => {
  const [summary] = await Order.aggregate([
    { $match: { createdAt: { $gte: start, $lt: end } } },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        completedOrders: { $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] } },
        cancelledOrders: { $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] } },
        revenue: { $sum: { $cond: [{ $eq: ["$status", "delivered"] }, "$total", 0] } }
      }
    }
  ]);
  return {
    revenue: summary?.revenue || 0,
    totalOrders: summary?.totalOrders || 0,
    completedOrders: summary?.completedOrders || 0,
    cancelledOrders: summary?.cancelledOrders || 0
  };
};

// GET: /admin/dashboard
module.exports.dashboard = async (req, res, next) => {
  try {
    const defaultRange = getDefaultRange();
    const bounds = getDateBounds(defaultRange.from, defaultRange.to);
    const summary = await getSummary(bounds.start, bounds.end);
    res.render("admin/pages/dashboard/index", {
      pageTitle: "Tổng quan",
      summary,
      defaultRange
    });
  } catch (error) {
    next(error);
  }
};

module.exports.chartData = async (req, res, next) => {
  try {
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    const { from, to } = req.query;
    if (!datePattern.test(from || "") || !datePattern.test(to || "")) {
      return res.status(400).json({ message: "Vui lòng chọn khoảng ngày hợp lệ." });
    }

    const fromUtc = new Date(`${from}T00:00:00Z`);
    const toUtc = new Date(`${to}T00:00:00Z`);
    if (fromUtc.toISOString().slice(0, 10) !== from || toUtc.toISOString().slice(0, 10) !== to || from > to) {
      return res.status(400).json({ message: "Ngày bắt đầu phải trước hoặc bằng ngày kết thúc." });
    }

    const { start, end } = getDateBounds(from, to);
    const daily = (toUtc - fromUtc) / (24 * 60 * 60 * 1000) < 31;
    const format = daily ? "%Y-%m-%d" : "%Y-%m";
    const [result] = await Order.aggregate([
      { $match: { createdAt: { $gte: start, $lt: end } } },
      {
        $facet: {
          summary: [
            {
              $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                completedOrders: { $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] } },
                cancelledOrders: { $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] } },
                revenue: { $sum: { $cond: [{ $eq: ["$status", "delivered"] }, "$total", 0] } }
              }
            }
          ],
          timeline: [
            {
              $group: {
                _id: { $dateToString: { date: "$createdAt", format, timezone: "Asia/Ho_Chi_Minh" } },
                orderCount: { $sum: 1 },
                revenue: { $sum: { $cond: [{ $eq: ["$status", "delivered"] }, "$total", 0] } }
              }
            },
            { $sort: { _id: 1 } }
          ]
        }
      }
    ]);

    const values = new Map(result.timeline.map((item) => [item._id, item]));
    const labels = [];
    const orders = [];
    const revenue = [];
    if (daily) {
      for (let day = new Date(fromUtc); day <= toUtc; day.setUTCDate(day.getUTCDate() + 1)) {
        const key = day.toISOString().slice(0, 10);
        const item = values.get(key);
        labels.push(key);
        orders.push(item?.orderCount || 0);
        revenue.push(item?.revenue || 0);
      }
    } else {
      const month = new Date(Date.UTC(fromUtc.getUTCFullYear(), fromUtc.getUTCMonth(), 1));
      const lastMonth = new Date(Date.UTC(toUtc.getUTCFullYear(), toUtc.getUTCMonth(), 1));
      while (month <= lastMonth) {
        const key = `${month.getUTCFullYear()}-${String(month.getUTCMonth() + 1).padStart(2, "0")}`;
        const item = values.get(key);
        labels.push(key);
        orders.push(item?.orderCount || 0);
        revenue.push(item?.revenue || 0);
        month.setUTCMonth(month.getUTCMonth() + 1);
      }
    }

    const summary = result.summary[0] || {};
    res.json({
      labels,
      orders,
      revenue,
      granularity: daily ? "day" : "month",
      summary: {
        revenue: summary.revenue || 0,
        totalOrders: summary.totalOrders || 0,
        completedOrders: summary.completedOrders || 0,
        cancelledOrders: summary.cancelledOrders || 0
      }
    });
  } catch (error) {
    next(error);
  }
};
