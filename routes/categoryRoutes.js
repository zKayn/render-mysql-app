const express = require('express');
const router = express.Router();
const { 
  getAllCategories, 
  getCategoryById, 
  addCategory, 
  updateCategory, 
  deleteCategory,
  getProductsByCategory
} = require('../controllers/categoryController');

// Định nghĩa các route
router.get('/', getAllCategories);
router.get('/:id', getCategoryById);
router.post('/add', addCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);
router.get('/:id/products', getProductsByCategory);

module.exports = router;