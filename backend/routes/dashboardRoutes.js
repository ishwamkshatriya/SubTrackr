const express = require('express');
const {
  getUserDashboard,
  getAdminDashboard,
  getAnalyticsData
} = require('../controllers/dashboardController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { userOnly, adminOnly } = require('../middleware/roleMiddleware');

const router = express.Router();

// User dashboard
router.get('/user', authMiddleware, userOnly, getUserDashboard);

// Admin dashboard
router.get('/admin', authMiddleware, adminOnly, getAdminDashboard);

// Analytics data
router.get('/analytics', authMiddleware, adminOnly, getAnalyticsData);

module.exports = router;
