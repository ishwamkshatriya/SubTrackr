const express = require('express');
const {
  createPlan,
  getPlans,
  getPlanById,
  updatePlan,
  deletePlan,
  togglePlanStatus,
  getPlansByProductType,
  comparePlans
} = require('../controllers/planController');
const { getPublicDiscounts } = require('../controllers/adminController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');

const router = express.Router();

// Public routes
router.get('/', getPlans);
router.get('/:id', getPlanById);
router.get('/product-type/:productType', getPlansByProductType);
router.post('/compare', comparePlans);
router.get('/discounts/public', getPublicDiscounts);

// Admin only routes
router.post('/', authMiddleware, adminOnly, createPlan);
router.put('/:id', authMiddleware, adminOnly, updatePlan);
router.delete('/:id', authMiddleware, adminOnly, deletePlan);
router.patch('/:id/toggle-status', authMiddleware, adminOnly, togglePlanStatus);

module.exports = router;
