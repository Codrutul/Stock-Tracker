const UserRepo = require('../models/UserRepo');
const User = require('../models/User');

// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
    try {
        const users = await UserRepo.getAllUsers();
        res.status(200).json(users);
    } catch (error) {
        console.error('Error in getAllUsers controller:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get user by ID
exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if user is requesting their own info or is admin
        if (req.user.id !== parseInt(id) && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'You can only access your own user information' });
        }
        
        const user = await UserRepo.getUserById(id);
        
        if (!user) {
            return res.status(404).json({ message: `User with ID ${id} not found` });
        }
        
        res.status(200).json(user);
    } catch (error) {
        console.error('Error in getUserById controller:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get user by username
exports.getUserByUsername = async (req, res) => {
    try {
        const { username } = req.params;
        
        // If not admin, only allow looking up their own username
        if (req.user.role !== 'admin' && req.user.username !== username) {
            return res.status(403).json({ message: 'You can only access your own user information' });
        }
        
        const user = await UserRepo.getUserByUsername(username);
        
        if (!user) {
            return res.status(404).json({ message: `User '${username}' not found` });
        }
        
        res.status(200).json(user);
    } catch (error) {
        console.error('Error in getUserByUsername controller:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Create a new user (admin only - regular users use auth/register endpoint)
exports.createUser = async (req, res) => {
    try {
        const userData = req.body;
        
        // Validate required fields
        if (!userData.username || !userData.email || !userData.password) {
            return res.status(400).json({ message: 'Username, email, and password are required' });
        }
        
        // Check if user already exists
        const exists = await UserRepo.userExists(userData.username);
        if (exists) {
            return res.status(409).json({ message: `Username '${userData.username}' already exists` });
        }
        
        // Check if email already exists
        const emailExists = await UserRepo.emailExists(userData.email);
        if (emailExists) {
            return res.status(409).json({ message: `Email '${userData.email}' already exists` });
        }
        
        // Create user
        const newUser = await UserRepo.createUser(userData);
        res.status(201).json(newUser);
    } catch (error) {
        console.error('Error in createUser controller:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update a user
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const userData = req.body;
        
        // Check if user is updating their own info or is admin
        if (req.user.id !== parseInt(id) && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'You can only update your own user information' });
        }
        
        // Regular users cannot change their role
        if (req.user.role !== 'admin' && userData.role && userData.role !== req.user.role) {
            return res.status(403).json({ message: 'You cannot change your own role' });
        }
        
        // Check if user exists
        const user = await UserRepo.getUserById(id);
        if (!user) {
            return res.status(404).json({ message: `User with ID ${id} not found` });
        }
        
        // If username is changing, check if the new username is already taken
        if (userData.username && userData.username !== user.username) {
            const usernameExists = await UserRepo.userExists(userData.username);
            if (usernameExists) {
                return res.status(409).json({ message: `Username '${userData.username}' already exists` });
            }
        }
        
        // Update user
        const updatedUser = await UserRepo.updateUser(id, userData);
        res.status(200).json(updatedUser);
    } catch (error) {
        console.error('Error in updateUser controller:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete a user
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Check if user is deleting their own account or is admin
        if (req.user.id !== parseInt(id) && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'You can only delete your own user account' });
        }
        
        // Check if user exists
        const user = await UserRepo.getUserById(id);
        if (!user) {
            return res.status(404).json({ message: `User with ID ${id} not found` });
        }
        
        // Delete user
        const deletedUser = await UserRepo.deleteUser(id);
        res.status(200).json({ message: `User with ID ${id} deleted successfully`, deletedUser });
    } catch (error) {
        console.error('Error in deleteUser controller:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}; 