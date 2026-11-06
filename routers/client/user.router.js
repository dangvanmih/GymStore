const express = require('express');
const router = express.Router();
const controller = require('../../controllers/client/user.controller');

router.get('/register', controller.register);
router.post('/register', controller.registerPost);
router.get('/login', controller.login);
router.post('/login', controller.loginPost);
router.get('/logout', controller.logout);

router.get('/otp-password', controller.otpPassword);
router.post('/otp-password', controller.otpPasswordPost);
router.post('/otp-password/resend', controller.resendOtp);
module.exports = router;
