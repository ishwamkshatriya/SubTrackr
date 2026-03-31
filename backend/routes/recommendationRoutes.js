const express = require('express');
const {
  getRecommendations,
  getChurnPrediction,
  getUsageBasedRecommendations,
  getSeasonalRecommendations,
  getPlanComparison,
  getGlobalRecommendation
} = require('../controllers/recommendationController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { userOnly } = require('../middleware/roleMiddleware');

const router = express.Router();

// All routes require authentication and user role
router.get('/', authMiddleware, userOnly, getRecommendations);
router.get('/churn-prediction', authMiddleware, userOnly, getChurnPrediction);
router.get('/usage-based', authMiddleware, userOnly, getUsageBasedRecommendations);
router.get('/seasonal', authMiddleware, userOnly, getSeasonalRecommendations);
router.post('/compare', authMiddleware, userOnly, getPlanComparison);
router.get('/global', authMiddleware, userOnly, getGlobalRecommendation);

module.exports = router;
