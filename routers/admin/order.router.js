const express = require("express");
const router = express.Router();
const controller = require("../../controllers/admin/order.controller");

router.get("/", controller.index);
router.get("/:id", controller.detail);
router.post("/:id/status", controller.advanceStatus);

module.exports = router;
