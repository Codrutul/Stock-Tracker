const User = require('./User');
const pool = require('../db');
const bcrypt = require('bcrypt');
const { encrypt, decrypt } = require('../utils/cryptoUtil'); // Import crypto utils

class UserRepo {
    constructor() {
        this.tableName = 'users';
    }

    // Initialize the users table
    async initialize() {
        try {
            // Create users table if it doesn't exist
            await pool.query(`
                CREATE TABLE IF NOT EXISTS ${this.tableName} (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(255) NOT NULL UNIQUE,
                    email VARCHAR(255) NOT NULL UNIQUE,
                    password VARCHAR(255) NOT NULL,
                    role VARCHAR(50) NOT NULL DEFAULT 'regular',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    two_factor_secret VARCHAR(255) NULL,
                    is_two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
                    two_factor_recovery_codes TEXT NULL 
                )
            `);
            console.log('Users table initialized (with 2FA columns)');
            return true;
        } catch (error) {
            console.error('Error initializing users table:', error);
            return false;
        }
    }

    // Create a new user
    async createUser(user) {
        try {
            const { username, email, password, role = 'regular' } = user;
            
            // Hash the password before storing
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(password, saltRounds);
            
            // Include current timestamp for created_at and updated_at
            const result = await pool.query(
                `INSERT INTO ${this.tableName} (username, email, password, role, created_at, updated_at)
                VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                RETURNING id, username, email, role, created_at, updated_at`,
                [username, email, hashedPassword, role]
            );
            
            return result.rows[0];
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    // Get all users
    async getAllUsers() {
        try {
            const result = await pool.query(
                `SELECT id, username, email, role, created_at, updated_at
                 FROM ${this.tableName}`
            );
            return result.rows;
        } catch (error) {
            console.error('Error getting all users:', error);
            throw error;
        }
    }

    // Get user by ID (include 2FA fields, decrypt secret)
    async getUserById(id) {
        try {
            const result = await pool.query(
                `SELECT id, username, email, role, created_at, updated_at, 
                 is_two_factor_enabled, two_factor_secret 
                 FROM ${this.tableName} WHERE id = $1`,
                [id]
            );
            const user = result.rows[0];
            if (user && user.two_factor_secret) {
                user.two_factor_secret = decrypt(user.two_factor_secret);
            }
            return user;
        } catch (error) {
            console.error('Error getting user by ID:', error);
            throw error;
        }
    }

    // Get user by username
    async getUserByUsername(username) {
        try {
            const result = await pool.query(
                `SELECT id, username, email, role, created_at, updated_at
                 FROM ${this.tableName} WHERE username = $1`,
                [username]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error getting user by username:', error);
            throw error;
        }
    }
    
    // Get complete user info by username (including password and 2FA for auth checks)
    async getUserWithPasswordByUsername(username) {
        try {
            const result = await pool.query(
                `SELECT * FROM ${this.tableName} WHERE username = $1`,
                [username]
            );
            const user = result.rows[0];
            if (user && user.two_factor_secret) {
                user.two_factor_secret = decrypt(user.two_factor_secret);
            }
            return user;
        } catch (error) {
            console.error('Error getting user with password:', error);
            throw error;
        }
    }

    // Update a user
    async updateUser(id, userData) {
        try {
            const { username, email, role } = userData;
            
            const result = await pool.query(
                `UPDATE ${this.tableName}
                SET username = $1, email = $2, role = $3, updated_at = CURRENT_TIMESTAMP
                WHERE id = $4
                RETURNING id, username, email, role, created_at, updated_at`,
                [username, email, role, id]
            );
            
            return result.rows[0];
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }
    
    // Update user password
    async updatePassword(id, newPassword) {
        try {
            const saltRounds = 10;
            const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
            
            const result = await pool.query(
                `UPDATE ${this.tableName}
                SET password = $1, updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
                RETURNING id, username, email, role, created_at, updated_at`,
                [hashedPassword, id]
            );
            
            return result.rows[0];
        } catch (error) {
            console.error('Error updating password:', error);
            throw error;
        }
    }

    // Delete a user
    async deleteUser(id) {
        try {
            const result = await pool.query(
                `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING *`,
                [id]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    }

    // Check if user exists by username
    async userExists(username) {
        try {
            const result = await pool.query(
                `SELECT COUNT(*) FROM ${this.tableName} WHERE username = $1`,
                [username]
            );
            return parseInt(result.rows[0].count) > 0;
        } catch (error) {
            console.error('Error checking if user exists:', error);
            throw error;
        }
    }
    
    // Check if user exists by email
    async emailExists(email) {
        try {
            const result = await pool.query(
                `SELECT COUNT(*) FROM ${this.tableName} WHERE email = $1`,
                [email]
            );
            return parseInt(result.rows[0].count) > 0;
        } catch (error) {
            console.error('Error checking if email exists:', error);
            throw error;
        }
    }
    
    // Verify password for authentication
    async verifyPassword(username, password) {
        try {
            const user = await this.getUserWithPasswordByUsername(username);
            if (!user) return false;
            
            return await bcrypt.compare(password, user.password);
        } catch (error) {
            console.error('Error verifying password:', error);
            throw error;
        }
    }

    // --- Methods for 2FA --- 

    async enableTwoFactor(userId, secret, recoveryCodes) {
        try {
            const encryptedSecret = encrypt(secret);
            const encryptedRecoveryCodes = recoveryCodes ? encrypt(JSON.stringify(recoveryCodes)) : null;
            await pool.query(
                `UPDATE ${this.tableName} 
                 SET is_two_factor_enabled = TRUE, two_factor_secret = $1, two_factor_recovery_codes = $2, updated_at = CURRENT_TIMESTAMP 
                 WHERE id = $3`,
                [encryptedSecret, encryptedRecoveryCodes, userId]
            );
            return true;
        } catch (error) {
            console.error(`Error enabling 2FA for user ${userId}:`, error);
            throw error;
        }
    }

    async disableTwoFactor(userId) {
        try {
            await pool.query(
                `UPDATE ${this.tableName} 
                 SET is_two_factor_enabled = FALSE, two_factor_secret = NULL, two_factor_recovery_codes = NULL, updated_at = CURRENT_TIMESTAMP 
                 WHERE id = $1`,
                [userId]
            );
            return true;
        } catch (error) {
            console.error(`Error disabling 2FA for user ${userId}:`, error);
            throw error;
        }
    }

    async getTwoFactorSecret(userId) {
        try {
            const result = await pool.query(
                `SELECT two_factor_secret FROM ${this.tableName} WHERE id = $1`,
                [userId]
            );
            if (result.rows.length > 0 && result.rows[0].two_factor_secret) {
                return decrypt(result.rows[0].two_factor_secret);
            }
            return null;
        } catch (error) {
            console.error(`Error getting 2FA secret for user ${userId}:`, error);
            throw error;
        }
    }

    async getRecoveryCodes(userId) {
        try {
            const result = await pool.query(
                `SELECT two_factor_recovery_codes FROM ${this.tableName} WHERE id = $1`,
                [userId]
            );
            if (result.rows.length > 0 && result.rows[0].two_factor_recovery_codes) {
                const decryptedCodes = decrypt(result.rows[0].two_factor_recovery_codes);
                return JSON.parse(decryptedCodes || '[]');
            }
            return [];
        } catch (error) {
            console.error(`Error getting recovery codes for user ${userId}:`, error);
            throw error;
        }
    }

    async updateRecoveryCodes(userId, recoveryCodes) {
        try {
            const encryptedRecoveryCodes = recoveryCodes ? encrypt(JSON.stringify(recoveryCodes)) : null;
            await pool.query(
                `UPDATE ${this.tableName} 
                 SET two_factor_recovery_codes = $1, updated_at = CURRENT_TIMESTAMP 
                 WHERE id = $2`,
                [encryptedRecoveryCodes, userId]
            );
            return true;
        } catch (error) {
            console.error(`Error updating recovery codes for user ${userId}:`, error);
            throw error;
        }
    }
}

module.exports = new UserRepo(); 