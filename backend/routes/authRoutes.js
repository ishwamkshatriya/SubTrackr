const express = require('express');
const {
  signUp,
  signIn,
  getProfile,
  updateProfile,
  changePassword,
  logout
} = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.post('/signup', signUp);
router.post('/signin', signIn);

// Protected routes
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);
router.put('/change-password', authMiddleware, changePassword);
router.post('/logout', authMiddleware, logout);

module.exports = router;
