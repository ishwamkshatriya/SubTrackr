const express = require('express');
const {
  subscribe,
  getUserSubscriptions,
  getSubscriptionById,
  upgradeDowngrade,
  cancel,
  renew,
  toggleAutoRenew,
  getAllSubscriptions
} = require('../controllers/subscriptionController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { userOnly, adminOnly, subscriptionOwnerOrAdmin } = require('../middleware/roleMiddleware');

const router = express.Router();

// User routes
router.post('/subscribe', authMiddleware, userOnly, subscribe);
router.get('/my-subscriptions', authMiddleware, userOnly, getUserSubscriptions);
router.get('/:id', authMiddleware, subscriptionOwnerOrAdmin, getSubscriptionById);
router.put('/modify', authMiddleware, userOnly, upgradeDowngrade);
router.put('/cancel/:subscriptionId', authMiddleware, userOnly, cancel);
router.put('/renew/:subscriptionId', authMiddleware, userOnly, renew);
router.patch('/:subscriptionId/toggle-auto-renew', authMiddleware, userOnly, toggleAutoRenew);

// Admin routes
router.get('/', authMiddleware, adminOnly, getAllSubscriptions);

module.exports = router;
