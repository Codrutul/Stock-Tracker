const pool = require('../db');

class MonitoredUserRepo {
    constructor() {
        this.tableName = 'monitored_users';
    }

    // Initialize the monitored_users table
    async initialize() {
        try {
            // Create monitored_users table if it doesn't exist
            await pool.query(`
                CREATE TABLE IF NOT EXISTS ${this.tableName} (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    reason TEXT NOT NULL,
                    action_count INTEGER DEFAULT 0,
                    threshold_exceeded BOOLEAN DEFAULT false,
                    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user_id)
                )
            `);
            
            // Create index for faster lookups
            await pool.query(`
                CREATE INDEX IF NOT EXISTS idx_monitored_users_user_id ON ${this.tableName}(user_id);
            `);
            
            console.log('✅ Monitored users table initialized');
            return true;
        } catch (error) {
            console.error('Error initializing monitored users table:', error);
            return false;
        }
    }

    // Add a user to the monitored list
    async addMonitoredUser(userId, reason, actionCount = 0) {
        try {
            // First check if user is already in the monitored list
            const exists = await this.isUserMonitored(userId);
            
            if (exists) {
                // Update the existing record
                const result = await pool.query(
                    `UPDATE ${this.tableName} 
                    SET reason = $1, action_count = $2, updated_at = CURRENT_TIMESTAMP 
                    WHERE user_id = $3 
                    RETURNING *`,
                    [reason, actionCount, userId]
                );
                console.log(`✅ Updated monitored user with ID ${userId}`);
                return result.rows[0];
            } else {
                // Create a new record
                const result = await pool.query(
                    `INSERT INTO ${this.tableName} 
                    (user_id, reason, action_count, detected_at, updated_at) 
                    VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
                    RETURNING *`,
                    [userId, reason, actionCount]
                );
                console.log(`✅ Added new user with ID ${userId} to monitored list`);
                return result.rows[0];
            }
        } catch (error) {
            console.error(`Error adding user ${userId} to monitored list:`, error);
            throw error;
        }
    }

    // Check if a user is already being monitored
    async isUserMonitored(userId) {
        try {
            const result = await pool.query(
                `SELECT EXISTS(SELECT 1 FROM ${this.tableName} WHERE user_id = $1)`,
                [userId]
            );
            return result.rows[0].exists;
        } catch (error) {
            console.error(`Error checking if user ${userId} is monitored:`, error);
            throw error;
        }
    }

    // Get all monitored users with user information
    async getAllMonitoredUsers() {
        try {
            const result = await pool.query(`
                SELECT m.*, u.username, u.email, u.role
                FROM ${this.tableName} m
                JOIN users u ON m.user_id = u.id
                ORDER BY m.detected_at DESC
            `);
            return result.rows;
        } catch (error) {
            console.error('Error fetching all monitored users:', error);
            throw error;
        }
    }

    // Get a specific monitored user record
    async getMonitoredUser(userId) {
        try {
            const result = await pool.query(
                `SELECT m.*, u.username, u.email, u.role
                FROM ${this.tableName} m
                JOIN users u ON m.user_id = u.id
                WHERE m.user_id = $1`,
                [userId]
            );
            return result.rows[0];
        } catch (error) {
            console.error(`Error fetching monitored user ${userId}:`, error);
            throw error;
        }
    }

    // Update a monitored user's record
    async updateMonitoredUser(userId, data) {
        try {
            const { reason, action_count, threshold_exceeded } = data;
            
            const result = await pool.query(
                `UPDATE ${this.tableName}
                SET reason = $1, action_count = $2, threshold_exceeded = $3, updated_at = CURRENT_TIMESTAMP
                WHERE user_id = $4
                RETURNING *`,
                [reason, action_count, threshold_exceeded, userId]
            );
            return result.rows[0];
        } catch (error) {
            console.error(`Error updating monitored user ${userId}:`, error);
            throw error;
        }
    }

    // Remove a user from the monitored list
    async removeMonitoredUser(userId) {
        try {
            const result = await pool.query(
                `DELETE FROM ${this.tableName} WHERE user_id = $1 RETURNING *`,
                [userId]
            );
            return result.rows[0];
        } catch (error) {
            console.error(`Error removing user ${userId} from monitored list:`, error);
            throw error;
        }
    }
}

module.exports = new MonitoredUserRepo(); 