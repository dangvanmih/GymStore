const express = require("express");
const router = express.Router();
const controller = require("../../controllers/admin/order.controller");
const { requirePermission } = require("../../middlewares/admin/permission.middleware");

router.get("/pending-count", requirePermission("orders_view"), controller.pendingCount);
router.get("/", requirePermission("orders_view"), controller.index);
router.get("/:id", requirePermission("orders_view"), controller.detail);
router.post("/:id/status", requirePermission("orders_update"), controller.advanceStatus);

module.exports = router;
