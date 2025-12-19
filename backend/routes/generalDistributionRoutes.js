const express = require('express');
const router = express.Router();
const {
  createDistribution,
  getAllDistributions,
  getDistributionById,
  updateDistribution,
  deleteDistribution,
} = require('../controllers/generalDistributionController');

// Distribution routes
router.post('/', createDistribution);
router.get('/', getAllDistributions);
router.get('/:id', getDistributionById);
router.put('/:id', updateDistribution);
router.delete('/:id', deleteDistribution);

module.exports = router;
