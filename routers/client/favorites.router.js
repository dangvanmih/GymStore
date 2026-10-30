const express = require("express");
const router = express.Router();
const controller = require("../../controllers/client/favorites.controller");

router.get("/", controller.index);
router.post("/toggle/:productId", controller.toggle);

module.exports = router;
