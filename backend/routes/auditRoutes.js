const express = require('express');
const {
  getAuditLogs,
  getAuditLogById,
  getUserAuditLogs,
  getResourceAuditLogs,
  getAuditLogStats,
  getSecurityAuditLogs,
  exportAuditLogs
} = require('../controllers/auditController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/roleMiddleware');

const router = express.Router();

// All routes require authentication and admin role
router.get('/', authMiddleware, adminOnly, getAuditLogs);
router.get('/stats', authMiddleware, adminOnly, getAuditLogStats);
router.get('/security', authMiddleware, adminOnly, getSecurityAuditLogs);
router.get('/export', authMiddleware, adminOnly, exportAuditLogs);
router.get('/:id', authMiddleware, adminOnly, getAuditLogById);
router.get('/user/:userId', authMiddleware, adminOnly, getUserAuditLogs);
router.get('/resource/:resource/:resourceId', authMiddleware, adminOnly, getResourceAuditLogs);

module.exports = router;
