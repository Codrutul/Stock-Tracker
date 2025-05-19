const UserRepo = require('../models/UserRepo');
const jwt = require('jsonwebtoken');
const TwoFactorService = require('../services/TwoFactorService'); // Import TwoFactorService

// Get JWT secret from environment variables or use default
const JWT_SECRET = process.env.JWT_SECRET || 'stock-tracker-secret-key';
const TOKEN_EXPIRY = '24h'; // Token expires in 24 hours

// Generate JWT token for a user
const generateToken = (user) => {
  // Don't include sensitive information like password in the token
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role || 'regular'
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
};

// Register a new user
exports.register = async (req, res) => {
    console.log(`INFO: backend/controllers/authController.js - register function called for user: ${req.body.username} at ${new Date().toISOString()}`);
    try {
        const { username, email, password, role } = req.body;
        
        // Validate required fields
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Username, email, and password are required' });
        }

        // Validate password strength
        if (password.length < 8) {
            return res.status(400).json({ message: 'Password must be at least 8 characters long' });
        }
        
        // Check if username already exists
        const usernameExists = await UserRepo.userExists(username);
        if (usernameExists) {
            return res.status(409).json({ message: `Username '${username}' is already taken` });
        }
        
        // Check if email already exists
        const emailExists = await UserRepo.emailExists(email);
        if (emailExists) {
            return res.status(409).json({ message: `Email '${email}' is already registered` });
        }
        
        // Set role to regular by default unless specifically creating an admin (admin can only be created by another admin)
        const userRole = role === 'admin' ? 'admin' : 'regular';
        
        // For simplicity, we're storing passwords directly
        // In a production environment, you must use password hashing!
        const newUser = await UserRepo.createUser({ 
            username, 
            email, 
            password, // Storing plaintext for demo only - NEVER do this in production!
            role: userRole 
        });
        
        // Generate JWT token
        const token = generateToken(newUser);
        
        // Return user data and token (excluding sensitive info)
        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role
            },
            token
        });
    } catch (error) {
        console.error('Error in register controller:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Login user
exports.login = async (req, res) => {
    try {
        const { username, password, twoFactorToken } = req.body; // Add twoFactorToken
        
        // Validate required fields
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }
        
        console.log(`Attempting login for user: ${username}`);
        
        const user = await UserRepo.getUserWithPasswordByUsername(username);
        
        if (!user) {
            console.log(`Login failed: User ${username} not found`);
            return res.status(401).json({ message: 'Invalid username or password' });
        }
        
        const bcrypt = require('bcrypt');
        const passwordMatch = await bcrypt.compare(password, user.password);
        
        if (!passwordMatch) {
            console.log(`Login failed: Invalid password for user ${username}`);
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        // --- 2FA Check --- 
        if (user.is_two_factor_enabled) {
            if (!twoFactorToken) {
                // If 2FA is enabled, but no token provided, prompt for it.
                console.log(`2FA required for user: ${username}`);
                return res.status(403).json({ 
                    message: 'Two-factor authentication required.', 
                    twoFactorEnabled: true 
                });
            }
            
            // UserRepo.getUserWithPasswordByUsername already decrypts the secret
            const isValidToken = TwoFactorService.verifyToken(user.two_factor_secret, twoFactorToken);
            
            if (!isValidToken) {
                console.log(`Login failed: Invalid 2FA token for user ${username}`);
                // Check recovery codes as a fallback
                const isValidRecoveryCode = await TwoFactorService.verifyRecoveryCode(user.id, twoFactorToken);
                if (!isValidRecoveryCode) {
                    return res.status(401).json({ message: 'Invalid two-factor authentication token or recovery code.' });
                }
                console.log(`Login successful with recovery code for user: ${username}`);
            } else {
                 console.log(`Login successful with 2FA token for user: ${username}`);
            }
        } else {
            console.log(`Login successful for user: ${username} (2FA not enabled)`);
        }
        
        const token = generateToken(user);
        
        // Return user data and token
        res.status(200).json({
            message: 'Login successful',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            },
            token
        });
    } catch (error) {
        console.error('Error in login controller:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get current user profile from JWT token
exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get user data
        const user = await UserRepo.getUserById(userId);
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Return user profile
        res.status(200).json({
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                isTwoFactorEnabled: user.is_two_factor_enabled
            }
        });
    } catch (error) {
        console.error('Error in getProfile controller:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Change password
exports.changePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;
        
        // Validate required fields
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current password and new password are required' });
        }
        
        // Validate password strength
        if (newPassword.length < 8) {
            return res.status(400).json({ message: 'New password must be at least 8 characters long' });
        }
        
        // Get user with password for verification
        const user = await UserRepo.getUserWithPasswordByUsername(req.user.username);
        
        // Verify current password with bcrypt
        const bcrypt = require('bcrypt');
        const passwordMatch = await bcrypt.compare(currentPassword, user.password);
        
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }
        
        // Update password using UserRepo method which handles bcrypt hashing
        await UserRepo.updatePassword(userId, newPassword);
        
        // Return success
        res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Error in changePassword controller:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// --- 2FA Endpoints ---

// Setup 2FA: Generates secret and QR code for the user to scan
exports.setupTwoFactor = async (req, res) => {
    try {
        const userId = req.user.id; // Assuming user is authenticated and req.user is populated
        const user = await UserRepo.getUserById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.is_two_factor_enabled) {
            return res.status(400).json({ message: '2FA is already enabled for this account.' });
        }

        const secretObject = TwoFactorService.generateSecret();
        // secretObject contains .ascii, .hex, .base32, .otpauth_url

        // Store the base32 secret temporarily, user needs to verify to enable it.
        // Or, we can store it now and mark it as pending verification.
        // For simplicity here, we'll send it back and expect a verification step.

        const qrCodeDataUrl = await TwoFactorService.generateQrCodeDataUrl(secretObject.otpauth_url);

        // Send the base32 secret and QR code to the client.
        // The client should display the QR code and allow the user to enter a token.
        res.status(200).json({
            message: '2FA setup initiated. Scan QR code and verify token.',
            secret: secretObject.base32, // Send base32 secret to user to verify
            qrCodeUrl: qrCodeDataUrl, // QR code for authenticator app
            otpAuthUrl: secretObject.otpauth_url // For manual entry if QR scan fails
        });

    } catch (error) {
        console.error('Error in setupTwoFactor controller:', error);
        res.status(500).json({ message: 'Server error during 2FA setup', error: error.message });
    }
};

// Verify 2FA token and enable 2FA for the user
exports.verifyAndEnableTwoFactor = async (req, res) => {
    try {
        const userId = req.user.id;
        const { token, secret } = req.body; // Token from authenticator, secret from previous step

        if (!token || !secret) {
            return res.status(400).json({ message: 'Token and secret are required for verification.' });
        }

        const isValid = TwoFactorService.verifyToken(secret, token);

        if (!isValid) {
            return res.status(400).json({ message: 'Invalid 2FA token. Please try again.' });
        }

        // Token is valid, now enable 2FA for the user and store the secret (encrypted)
        // Also generate and store recovery codes
        const recoveryCodes = TwoFactorService.generateRecoveryCodes();
        await UserRepo.enableTwoFactor(userId, secret, recoveryCodes);

        res.status(200).json({
            message: '2FA has been successfully enabled!',
            recoveryCodes: recoveryCodes // IMPORTANT: Show these to the user ONCE.
        });

    } catch (error) {
        console.error('Error in verifyAndEnableTwoFactor controller:', error);
        res.status(500).json({ message: 'Server error enabling 2FA', error: error.message });
    }
};

// Disable 2FA for the user
exports.disableTwoFactor = async (req, res) => {
    try {
        const userId = req.user.id;
        const { password } = req.body; // Require current password to disable 2FA

        if (!password) {
            return res.status(400).json({ message: 'Current password is required to disable 2FA.'});
        }

        const user = await UserRepo.getUserWithPasswordByUsername(req.user.username);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const bcrypt = require('bcrypt');
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Incorrect password.' });
        }

        await UserRepo.disableTwoFactor(userId);

        res.status(200).json({ message: '2FA has been successfully disabled.' });

    } catch (error) {
        console.error('Error in disableTwoFactor controller:', error);
        res.status(500).json({ message: 'Server error disabling 2FA', error: error.message });
    }
}; 