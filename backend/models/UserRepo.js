const User = require('./User');
const pool = require('../db');

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
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('Users table initialized');
            return true;
        } catch (error) {
            console.error('Error initializing users table:', error);
            return false;
        }
    }

    // Create a new user
    async createUser(user) {
        try {
            const { username, email } = user;
            
            const result = await pool.query(
                `INSERT INTO ${this.tableName} (username, email)
                VALUES ($1, $2)
                RETURNING *`,
                [username, email]
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
            const result = await pool.query(`SELECT * FROM ${this.tableName}`);
            return result.rows;
        } catch (error) {
            console.error('Error getting all users:', error);
            throw error;
        }
    }

    // Get user by ID
    async getUserById(id) {
        try {
            const result = await pool.query(
                `SELECT * FROM ${this.tableName} WHERE id = $1`,
                [id]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error getting user by ID:', error);
            throw error;
        }
    }

    // Get user by username
    async getUserByUsername(username) {
        try {
            const result = await pool.query(
                `SELECT * FROM ${this.tableName} WHERE username = $1`,
                [username]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error getting user by username:', error);
            throw error;
        }
    }

    // Update a user
    async updateUser(id, userData) {
        try {
            const { username, email } = userData;
            
            const result = await pool.query(
                `UPDATE ${this.tableName}
                SET username = $1, email = $2, updated_at = CURRENT_TIMESTAMP
                WHERE id = $3
                RETURNING *`,
                [username, email, id]
            );
            
            return result.rows[0];
        } catch (error) {
            console.error('Error updating user:', error);
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
}

module.exports = new UserRepo(); 