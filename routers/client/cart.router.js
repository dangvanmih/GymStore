const express = require('express');
const router = express.Router();
const controller = require('../../controllers/client/cart.controller');

router.get('/' , controller.index);
router.post('/add/:productId', controller.addPost);
router.post('/update', controller.updatePost);
router.get('/delete/:productId' , controller.delete);
module.exports = router;
