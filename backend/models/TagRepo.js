const Tag = require('./Tag');
const pool = require('../db');

class TagRepo {
    constructor() {
        this.tableName = 'tags';
        this.relationTableName = 'stock_tags'; // For many-to-many relationship
    }

    // Initialize the tags tables
    async initialize() {
        try {
            // Create tags table if it doesn't exist
            await pool.query(`
                CREATE TABLE IF NOT EXISTS ${this.tableName} (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL UNIQUE,
                    category VARCHAR(100) DEFAULT 'general',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            // Create many-to-many relationship table between stocks and tags
            await pool.query(`
                CREATE TABLE IF NOT EXISTS ${this.relationTableName} (
                    id SERIAL PRIMARY KEY,
                    stock_name VARCHAR(255) NOT NULL,
                    tag_id INTEGER NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (stock_name) REFERENCES stocks(name) ON DELETE CASCADE,
                    FOREIGN KEY (tag_id) REFERENCES ${this.tableName}(id) ON DELETE CASCADE,
                    UNIQUE(stock_name, tag_id)
                )
            `);
            
            console.log('Tags tables initialized');
            return true;
        } catch (error) {
            console.error('Error initializing tags tables:', error);
            return false;
        }
    }

    // Create a new tag
    async createTag(tag) {
        try {
            const { name, category } = tag;
            
            const result = await pool.query(
                `INSERT INTO ${this.tableName} (name, category)
                VALUES ($1, $2)
                RETURNING *`,
                [name, category]
            );
            
            return result.rows[0];
        } catch (error) {
            console.error('Error creating tag:', error);
            throw error;
        }
    }

    // Get all tags
    async getAllTags() {
        try {
            const result = await pool.query(`SELECT * FROM ${this.tableName}`);
            return result.rows;
        } catch (error) {
            console.error('Error getting all tags:', error);
            throw error;
        }
    }

    // Get tag by ID
    async getTagById(id) {
        try {
            const result = await pool.query(
                `SELECT * FROM ${this.tableName} WHERE id = $1`,
                [id]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error getting tag by ID:', error);
            throw error;
        }
    }

    // Get tag by name
    async getTagByName(name) {
        try {
            const result = await pool.query(
                `SELECT * FROM ${this.tableName} WHERE name = $1`,
                [name]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error getting tag by name:', error);
            throw error;
        }
    }

    // Update a tag
    async updateTag(id, tagData) {
        try {
            const { name, category } = tagData;
            
            const result = await pool.query(
                `UPDATE ${this.tableName}
                SET name = $1, category = $2
                WHERE id = $3
                RETURNING *`,
                [name, category, id]
            );
            
            return result.rows[0];
        } catch (error) {
            console.error('Error updating tag:', error);
            throw error;
        }
    }

    // Delete a tag
    async deleteTag(id) {
        try {
            const result = await pool.query(
                `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING *`,
                [id]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error deleting tag:', error);
            throw error;
        }
    }

    // Assign tag to stock (add relationship)
    async assignTagToStock(stockName, tagId) {
        try {
            const result = await pool.query(
                `INSERT INTO ${this.relationTableName} (stock_name, tag_id)
                VALUES ($1, $2)
                ON CONFLICT (stock_name, tag_id) DO NOTHING
                RETURNING *`,
                [stockName, tagId]
            );
            
            return result.rows[0];
        } catch (error) {
            console.error('Error assigning tag to stock:', error);
            throw error;
        }
    }

    // Remove tag from stock (remove relationship)
    async removeTagFromStock(stockName, tagId) {
        try {
            const result = await pool.query(
                `DELETE FROM ${this.relationTableName}
                WHERE stock_name = $1 AND tag_id = $2
                RETURNING *`,
                [stockName, tagId]
            );
            
            return result.rows[0];
        } catch (error) {
            console.error('Error removing tag from stock:', error);
            throw error;
        }
    }

    // Get all tags for a specific stock
    async getStockTags(stockName) {
        try {
            const result = await pool.query(
                `SELECT t.* 
                FROM ${this.tableName} t
                JOIN ${this.relationTableName} st ON t.id = st.tag_id
                WHERE st.stock_name = $1`,
                [stockName]
            );
            
            return result.rows;
        } catch (error) {
            console.error('Error getting stock tags:', error);
            throw error;
        }
    }

    // Get all stocks with a specific tag
    async getStocksWithTag(tagId) {
        try {
            const result = await pool.query(
                `SELECT s.* 
                FROM stocks s
                JOIN ${this.relationTableName} st ON s.name = st.stock_name
                WHERE st.tag_id = $1`,
                [tagId]
            );
            
            return result.rows;
        } catch (error) {
            console.error('Error getting stocks with tag:', error);
            throw error;
        }
    }

    // Get filtered and sorted tags
    async getFilteredAndSortedTags(category = null, sortBy = 'name') {
        try {
            let query = `SELECT * FROM ${this.tableName}`;
            const queryParams = [];
            
            // Add category filter if provided
            if (category) {
                query += ` WHERE category = $1`;
                queryParams.push(category);
            }
            
            // Add sorting
            switch (sortBy) {
                case 'created_at':
                    query += ` ORDER BY created_at DESC`;
                    break;
                case 'category':
                    query += ` ORDER BY category ASC, name ASC`;
                    break;
                default:
                    query += ` ORDER BY name ASC`;
            }
            
            const result = await pool.query(query, queryParams);
            return result.rows;
        } catch (error) {
            console.error('Error getting filtered and sorted tags:', error);
            throw error;
        }
    }
}

module.exports = new TagRepo(); 