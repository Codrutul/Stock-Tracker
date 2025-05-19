const express = require('express');
const router = express.Router();
const monitoringController = require('../controllers/monitoringController');
const { authenticateToken, isAdmin } = require('../middlewares/auth');

// All routes require authentication and admin privileges
router.use(authenticateToken);
router.use(isAdmin);

// Get all monitored users
router.get('/users', monitoringController.getMonitoredUsers);

// Get a specific monitored user
router.get('/users/:userId', monitoringController.getMonitoredUser);

// Add a user to monitoring list
router.post('/users', monitoringController.addMonitoredUser);

// Update a monitored user
router.put('/users/:userId', monitoringController.updateMonitoredUser);

// Remove a user from monitoring
router.delete('/users/:userId', monitoringController.removeMonitoredUser);

// Get suspicious activity alerts
router.get('/alerts', monitoringController.getSuspiciousActivities);

// Get system monitoring stats
router.get('/stats', monitoringController.getMonitoringStats);

// Reset alert for a specific user
router.post('/alerts/:userId/reset', monitoringController.resetUserAlert);

module.exports = router; 