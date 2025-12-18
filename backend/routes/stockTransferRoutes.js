const express = require('express');
const router = express.Router();
const {
  getColleges,
  createCollege,
  updateCollege,
  deleteCollege,
  getCollegeStock,
  getCollegeStockAll,
  createStockTransfer,
  getStockTransfers,
  getStockTransferById,
  updateStockTransfer,
  deleteStockTransfer,
  completeStockTransfer,
} = require('../controllers/stockTransferController');

// College routes
router.route('/colleges').get(getColleges).post(createCollege);
router.route('/colleges/:id').put(updateCollege).delete(deleteCollege);
router.route('/colleges/:id/stock').get(getCollegeStockAll);
router.route('/colleges/:id/stock/:productId').get(getCollegeStock);

// Maintain backward compatibility for a while (optional but good practice)
// Map old branch routes to new college handlers
router.route('/branches').get(getColleges).post(createCollege);
router.route('/branches/:id').put(updateCollege).delete(deleteCollege);
router.route('/branches/:id/stock').get(getCollegeStockAll);
router.route('/branches/:id/stock/:productId').get(getCollegeStock);

// Transfer routes
router.route('/').post(createStockTransfer).get(getStockTransfers);
router.route('/:id').get(getStockTransferById).put(updateStockTransfer).delete(deleteStockTransfer);
router.route('/:id/complete').post(completeStockTransfer);

module.exports = router;
