const express = require('express');
const router = express.Router();
const {
  createPurchase,
  getAllPurchases,
  getPurchaseById,
  deletePurchase,
} = require('../controllers/generalPurchaseController');

// Purchase routes
router.post('/', createPurchase);
router.get('/', getAllPurchases);
router.get('/:id', getPurchaseById);
router.delete('/:id', deletePurchase);

module.exports = router;
