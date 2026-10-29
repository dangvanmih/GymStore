const express = require('express');
const router = express.Router();
const controller = require('../../controllers/client/products.controller');

router.get('/', controller.index);
router.get('/api/search', controller.searchSuggestion);
router.get('/search', controller.search);
router.get('/featured', controller.featured);
router.get('/detail/:slug', controller.detailProduct);
router.get('/:slug', controller.category);
module.exports = router; 
