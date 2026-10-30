const express = require("express");
const router = express.Router();
const checkoutController = require("../../controllers/client/checkout.controller");
const ordersController = require("../../controllers/client/orders.controller");

router.get("/", ordersController.index);
router.post("/lookup", ordersController.lookup);
router.get("/:orderId/complete", checkoutController.complete);
router.get("/:orderId", ordersController.detail);

module.exports = router;
