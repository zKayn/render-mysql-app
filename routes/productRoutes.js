const express = require('express');
const router = express.Router();
const { 
  getAllProducts, 
  getProductById, 
  addProduct, 
  updateProduct, 
  deleteProduct 
} = require('../controllers/productController');

// Định nghĩa các route
router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.post('/add', addProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;