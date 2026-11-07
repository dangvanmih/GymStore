const express = require('express');
const router = express.Router();
const controller = require('../../controllers/client/user.controller');

router.get('/register', controller.register);
router.post('/register', controller.registerPost);
router.get('/login', controller.login);
router.post('/login', controller.loginPost);
router.get('/forgot-password', controller.forgotPassword);
router.post('/forgot-password', controller.forgotPasswordPost);
router.get('/forgot-password/verify', controller.verifyPasswordOtp);
router.post('/forgot-password/verify', controller.verifyPasswordOtpPost);
router.post('/forgot-password/resend', controller.resendPasswordOtp);
router.get('/reset-password', controller.resetPassword);
router.post('/reset-password', controller.resetPasswordPost);
router.get('/logout', controller.logout);
router.get('/profile', controller.profile);
router.post('/profile', controller.profilePost);
router.get('/profile/password', controller.passwordPage);
router.post('/profile/password', controller.changePassword);
router.get('/addresses', controller.addresses);
router.get('/addresses/:addressId/edit', controller.editAddress);
router.post('/addresses/:addressId/edit', controller.updateAddress);
router.post('/addresses/:addressId/default', controller.setDefaultAddress);

router.get('/otp-password', controller.otpPassword);
router.post('/otp-password', controller.otpPasswordPost);
router.post('/otp-password/resend', controller.resendOtp);
module.exports = router;
