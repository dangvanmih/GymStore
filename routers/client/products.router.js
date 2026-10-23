const express = require('express');
const router = express.Router();
const controller = require('../../controllers/client/products.controller');

router.get('/', controller.index);
router.get('/:slug', controller.category);
router.get('/detail/:slug', controller.detailProduct);
router.get('/api/search', controller.searchSuggestion);
module.exports = router; 