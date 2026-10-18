const express = require('express');
const router = express.Router();

const Controller = require('../../controllers/admin/auth.controller');
const Validate = require("../../validates/admin/auth.validate");
router.get('/login', Controller.authLogin);
router.post('/login',Validate.loginPost, Controller.loginPost);
module.exports = router;