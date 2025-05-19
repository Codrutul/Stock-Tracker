console.log('INFO: backend/routes/authRoutes.js - Script loaded at', new Date().toISOString());
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middlewares/auth');

// Public routes (no auth required)
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes (auth required)
router.get('/profile', authenticateToken, authController.getProfile);
router.post('/change-password', authenticateToken, authController.changePassword);

// --- 2FA Routes ---
// Initiate 2FA setup (generates QR code and secret)
router.post('/2fa/setup', authenticateToken, authController.setupTwoFactor);

// Verify token and enable 2FA
router.post('/2fa/verify', authenticateToken, authController.verifyAndEnableTwoFactor);

// Disable 2FA
router.post('/2fa/disable', authenticateToken, authController.disableTwoFactor);

module.exports = router; 