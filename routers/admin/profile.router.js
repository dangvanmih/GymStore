const express = require('express');
const router = express.Router();
const controller = require('../../controllers/admin/profile.controller');
const multer = require('multer');
const upload = multer();
const uploadCloudinaryMiddleware = require('../../middlewares/admin/uploadCloudinary.middleware');
const validate = require('../../validates/admin/acccount.validate');

router.get('/', controller.index);
router.patch('/edit',
  upload.single('avatar'),
  uploadCloudinaryMiddleware.uploadCloudinary,
  validate.editPatch,
  controller.editPatch);
module.exports = router;