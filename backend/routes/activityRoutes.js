const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const { authenticateToken, isAdmin } = require('../middlewares/auth');

// All of these routes require authentication
router.use(authenticateToken);

// User routes (users can only access their own activity)
router.get('/user/:userId', activityController.getUserActivity);

// Admin-only routes
router.get('/all', isAdmin, activityController.getAllActivity);
router.get('/stats', isAdmin, activityController.getActivityStats);
router.get('/login', isAdmin, activityController.getLoginActivity);

module.exports = router; 