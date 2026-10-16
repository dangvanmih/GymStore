const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer();
const uploadCloudinaryMiddleware = require('../../middlewares/admin/uploadCloudinary.middleware');
const controller = require('../../controllers/admin/account.controller');
const validate = require('../../validates/admin/acccount.validate');
router.get('/', controller.index);
router.get('/create', controller.create);
router.post('/create',
  upload.single('avatar'),
  uploadCloudinaryMiddleware.uploadCloudinary,
  validate.createPost,
  controller.createPost);


module.exports = router;
