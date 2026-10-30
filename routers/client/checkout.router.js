const express = require("express");
const router = express.Router();
const controller = require("../../controllers/client/checkout.controller");

router.get("/", controller.index);
router.post("/addresses", controller.addAddress);
router.post("/addresses/:addressId/delete", controller.deleteAddress);
router.post("/place-order", controller.placeOrder);

module.exports = router;
