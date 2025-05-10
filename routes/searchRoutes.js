const express = require('express');
const router = express.Router();
const { searchProducts } = require('../controllers/searchController');

// Định nghĩa route tìm kiếm
router.get('/', searchProducts);

module.exports = router;