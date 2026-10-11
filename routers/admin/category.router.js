const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer();
const uploadCloudinaryMiddleware = require('../../middlewares/admin/uploadCloudinary.middleware');
const validate = require('../../validates/admin/category.validate');
const controller = require('../../controllers/admin/category.controller');

router.get('/', controller.index);
router.get('/create', controller.create);
router.post(
  '/create/',
  upload.single('thumbnail'),
  uploadCloudinaryMiddleware.uploadCloudinary,
  validate.createPost,
  controller.createPost);

module.exports = router;