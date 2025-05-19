const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken, isAdmin } = require('../middlewares/auth');

// All dashboard routes require authentication and admin privileges
router.use(authenticateToken);
router.use(isAdmin);

// Dashboard routes
router.get('/overview', dashboardController.getSystemOverview);
router.get('/recent-registrations', dashboardController.getRecentRegistrations);
router.get('/activity-trends', dashboardController.getActivityTrends);
router.get('/active-users', dashboardController.getMostActiveUsers);

module.exports = router; 