const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const pool = require('../db');
const path = require('path');

// Load environment variables with absolute path
dotenv.config({ path: path.resolve(__dirname, '../database.env') });

// JWT secret key from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'stock-tracker-secret-key';
console.log(`JWT_SECRET loaded: ${JWT_SECRET ? 'Yes (from env)' : 'No (using fallback)'}`);

const TOKEN_EXPIRY = '24h'; // Token expires in 24 hours

// Generate JWT token for a user
exports.generateToken = (user) => {
    // Don't include sensitive information like password in the token
    const payload = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
    };
    
    return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
};

// Middleware to verify JWT token
exports.authenticateToken = (req, res, next) => {
    // Get the auth header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN format
    
    if (!token) {
        console.log('🛑 Authentication failed: No token provided');
        return res.status(401).json({ message: 'Authentication required' });
    }
    
    try {
        // Verify the token synchronously to catch errors properly
        const user = jwt.verify(token, JWT_SECRET);
        
        // Add user info to request object
        req.user = user;
        
        // Log authentication event - but wrap in try/catch to prevent errors here from breaking auth
        try {
            logUserActivity(user.id, 'authentication', 'User authenticated', { 
                endpoint: req.originalUrl, 
                method: req.method 
            });
        } catch (logError) {
            console.error('Error logging authentication activity:', logError);
            // Proceed anyway as this is just logging
        }
        
        next();
    } catch (err) {
        console.log(`🛑 Token verification failed: ${err.message}`);
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired, please login again' });
        } else if (err.name === 'JsonWebTokenError') {
            return res.status(403).json({ message: 'Invalid token' });
        }
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
};

// Middleware to check if user has admin role
exports.isAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (req.user.role !== 'admin') {
        // Log unauthorized access attempt
        logUserActivity(req.user.id, 'authorization', 'Admin access denied', { 
            endpoint: req.originalUrl, 
            method: req.method 
        });
        
        return res.status(403).json({ message: 'Admin privileges required' });
    }
    
    // Log successful admin access
    logUserActivity(req.user.id, 'authorization', 'Admin access granted', { 
        endpoint: req.originalUrl, 
        method: req.method 
    });
    
    next();
};

// Middleware to log all requests with user context if available
exports.logActivity = (req, res, next) => {
    const userId = req.user?.id || null;
    
    if (userId) {
        const activityType = determineActivityType(req);
        const description = `${req.method} ${req.originalUrl}`;
        const metadata = {
            method: req.method,
            path: req.originalUrl,
            query: req.query,
            // Don't log full request body which might contain sensitive data
            bodyKeys: Object.keys(req.body || {}),
            ip: req.ip,
            userAgent: req.headers['user-agent']
        };
        
        logUserActivity(userId, activityType, description, metadata);
    }
    
    next();
};

// Helper function to determine activity type from the request
function determineActivityType(req) {
    const path = req.originalUrl.toLowerCase();
    const method = req.method.toUpperCase();
    
    if (path.includes('/auth/login') || path.includes('/auth/register')) {
        return 'authentication';
    }
    
    if (path.includes('/profile') || path.includes('/user')) {
        return 'profile';
    }
    
    if (path.includes('/stock') || path.includes('/portfolio')) {
        if (method === 'GET') {
            return 'view';
        }
        return 'transaction';
    }
    
    if (method === 'GET') {
        return 'view';
    }
    
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
        return 'update';
    }
    
    if (method === 'DELETE') {
        return 'delete';
    }
    
    return 'other';
}

// Function to log user activity to the database
async function logUserActivity(userId, activityType, description, metadata = {}) {
    try {
        await pool.query(
            `INSERT INTO user_activity_logs 
            (user_id, activity_type, description, metadata, created_at) 
            VALUES ($1, $2, $3, $4, NOW())`,
            [userId, activityType, description, JSON.stringify(metadata)]
        );
    } catch (error) {
        console.error('Error logging user activity:', error);
        // Don't throw the error as logging shouldn't interrupt the main flow
    }
}

// Initialize activity logging table
exports.initializeActivityLogging = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS user_activity_logs (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
                activity_type VARCHAR(50) NOT NULL,
                description TEXT NOT NULL,
                metadata JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Create index for faster queries
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity_logs(user_id);
            CREATE INDEX IF NOT EXISTS idx_user_activity_type ON user_activity_logs(activity_type);
            CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity_logs(created_at);
        `);
        
        console.log('✅ User activity logging initialized');
        return true;
    } catch (error) {
        console.error('Error initializing activity logging:', error);
        return false;
    }
}; 