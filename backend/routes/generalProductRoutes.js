const express = require('express');
const router = express.Router();
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  addStock,
  getCollegeStock,
} = require('../controllers/generalProductController');

// Product routes
router.post('/', createProduct);
router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

// Stock management
router.post('/:id/add-stock', addStock);

// College stock
router.get('/colleges/:collegeId/stock', getCollegeStock);

module.exports = router;
