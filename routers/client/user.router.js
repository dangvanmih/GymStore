const express = require('express');
const router = express.Router();
const controller = require('../../controllers/client/user.controller');

router.get('/register', controller.register);
router.post('/register', controller.registerPost);

router.get('/otp-password', controller.otpPassword);
router.post('/otp-password', controller.otpPasswordPost);
module.exports = router;