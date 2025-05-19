const UserRepo = require('../models/UserRepo');
const jwt = require('jsonwebtoken');

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
        const { username, password } = req.body;
        
        // Validate required fields
        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }
        
        console.log(`Attempting login for user: ${username}`);
        
        // Get user data including password for verification
        const user = await UserRepo.getUserWithPasswordByUsername(username);
        
        // Check if user exists
        if (!user) {
            console.log(`Login failed: User ${username} not found`);
            return res.status(401).json({ message: 'Invalid username or password' });
        }
        
        // Compare passwords using bcrypt directly instead of UserRepo.verifyPassword
        const bcrypt = require('bcrypt');
        const passwordMatch = await bcrypt.compare(password, user.password);
        
        if (!passwordMatch) {
            console.log(`Login failed: Invalid password for user ${username}`);
            return res.status(401).json({ message: 'Invalid username or password' });
        }
        
        console.log(`Login successful for user: ${username}`);
        
        // Generate JWT token
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
                role: user.role
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