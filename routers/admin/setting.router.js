const express = require("express");
const multer = require("multer");
const router = express.Router();
const controller = require("../../controllers/admin/setting.controller");
const uploadCloudinaryMiddleware = require("../../middlewares/admin/uploadCloudinary.middleware");

router.get("/", controller.index);
router.patch("/", multer({ limits: { fileSize: 5 * 1024 * 1024 } }).single("clientLogoFile"), uploadCloudinaryMiddleware.uploadCloudinary, controller.update);

module.exports = router;
