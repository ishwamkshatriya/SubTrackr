const express = require('express');
const {
  getAllUsers,
  getUserById,
  updateUser,
  toggleUserStatus,
  createDiscount,
  getDiscounts,
  updateDiscount,
  deleteDiscount,
  getDiscountUsageReport,
  sendNotification,
  sendNotificationToRole
} = require('../controllers/adminController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');

const router = express.Router();

// All routes require authentication and admin role
router.get('/users', authMiddleware, adminOnly, getAllUsers);
router.get('/users/:id', authMiddleware, adminOnly, getUserById);
router.put('/users/:id', authMiddleware, adminOnly, updateUser);
router.patch('/users/:id/toggle-status', authMiddleware, adminOnly, toggleUserStatus);

// Discount management
router.post('/discounts', authMiddleware, adminOnly, createDiscount);
router.get('/discounts', authMiddleware, adminOnly, getDiscounts);
router.put('/discounts/:id', authMiddleware, adminOnly, updateDiscount);
router.delete('/discounts/:id', authMiddleware, adminOnly, deleteDiscount);
router.get('/discounts/usage', authMiddleware, adminOnly, getDiscountUsageReport);

// Notification management
router.post('/notifications/send', authMiddleware, adminOnly, sendNotification);
router.post('/notifications/send-to-role', authMiddleware, adminOnly, sendNotificationToRole);

module.exports = router;
