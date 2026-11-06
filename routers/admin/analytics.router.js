const express = require("express");
const router = express.Router();
const controller = require("../../controllers/admin/analytics.controller");
const { requirePermission } = require("../../middlewares/admin/permission.middleware");

router.use(requirePermission("orders_view"));
router.get("/export", controller.export);
router.get("/data", controller.data);
router.get("/", controller.index);

module.exports = router;
