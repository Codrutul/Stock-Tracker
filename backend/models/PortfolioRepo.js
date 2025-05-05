const Portfolio = require('./Portfolio');
const UserRepo = require('./UserRepo');
const StockRepo = require('./StockRepo');
const pool = require('../db');

class PortfolioRepo {
    constructor() {
        this.tableName = 'portfolios';
    }

    // Initialize the portfolio table (establishes many-to-many relationship)
    async initialize() {
        try {
            // Create portfolio table if it doesn't exist
            await pool.query(`
                CREATE TABLE IF NOT EXISTS ${this.tableName} (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    stock_name VARCHAR(255) NOT NULL,
                    quantity NUMERIC DEFAULT 0,
                    purchase_price NUMERIC DEFAULT 0,
                    purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    notes TEXT DEFAULT '',
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (stock_name) REFERENCES stocks(name) ON DELETE CASCADE,
                    UNIQUE(user_id, stock_name)
                )
            `);
            console.log('Portfolio table initialized');
            return true;
        } catch (error) {
            console.error('Error initializing portfolio table:', error);
            return false;
        }
    }

    // Add a stock to user's portfolio (creates portfolio entry)
    async addStockToPortfolio(portfolio) {
        try {
            const { userId, stockName, quantity, purchasePrice, notes } = portfolio;
            
            const result = await pool.query(
                `INSERT INTO ${this.tableName} (user_id, stock_name, quantity, purchase_price, notes)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *`,
                [userId, stockName, quantity, purchasePrice, notes]
            );
            
            return result.rows[0];
        } catch (error) {
            console.error('Error adding stock to portfolio:', error);
            throw error;
        }
    }

    // Get all stocks in a user's portfolio
    async getUserPortfolio(userId) {
        try {
            // Join with stocks table to get stock details along with portfolio information
            const result = await pool.query(
                `SELECT p.*, s.price, s.change, s.industry, s.image_src, s.marketCap, 
                         s.dividendAmount, s.headquarters, s.peRatio
                 FROM ${this.tableName} p
                 JOIN stocks s ON p.stock_name = s.name
                 WHERE p.user_id = $1`,
                [userId]
            );
            
            return result.rows;
        } catch (error) {
            console.error('Error getting user portfolio:', error);
            throw error;
        }
    }

    // Get portfolio entry by ID
    async getPortfolioEntryById(id) {
        try {
            const result = await pool.query(
                `SELECT * FROM ${this.tableName} WHERE id = $1`,
                [id]
            );
            
            return result.rows[0];
        } catch (error) {
            console.error('Error getting portfolio entry by ID:', error);
            throw error;
        }
    }

    // Get portfolio entry by user and stock
    async getPortfolioEntry(userId, stockName) {
        try {
            const result = await pool.query(
                `SELECT * FROM ${this.tableName} 
                 WHERE user_id = $1 AND stock_name = $2`,
                [userId, stockName]
            );
            
            return result.rows[0];
        } catch (error) {
            console.error('Error getting portfolio entry:', error);
            throw error;
        }
    }

    // Update portfolio entry
    async updatePortfolioEntry(id, portfolioData) {
        try {
            const { quantity, purchasePrice, notes } = portfolioData;
            
            const result = await pool.query(
                `UPDATE ${this.tableName}
                 SET quantity = $1, purchase_price = $2, notes = $3
                 WHERE id = $4
                 RETURNING *`,
                [quantity, purchasePrice, notes, id]
            );
            
            return result.rows[0];
        } catch (error) {
            console.error('Error updating portfolio entry:', error);
            throw error;
        }
    }

    // Remove stock from portfolio
    async removeStockFromPortfolio(userId, stockName) {
        try {
            const result = await pool.query(
                `DELETE FROM ${this.tableName}
                 WHERE user_id = $1 AND stock_name = $2
                 RETURNING *`,
                [userId, stockName]
            );
            
            return result.rows[0];
        } catch (error) {
            console.error('Error removing stock from portfolio:', error);
            throw error;
        }
    }

    // Get users who own a specific stock
    async getUsersOwningStock(stockName) {
        try {
            const result = await pool.query(
                `SELECT u.*, p.quantity, p.purchase_price, p.purchase_date, p.notes
                 FROM ${this.tableName} p
                 JOIN users u ON p.user_id = u.id
                 WHERE p.stock_name = $1`,
                [stockName]
            );
            
            return result.rows;
        } catch (error) {
            console.error('Error getting users owning stock:', error);
            throw error;
        }
    }

    // Get filtered and sorted portfolio entries
    async getFilteredAndSortedPortfolio(userId, industry = null, minPrice = 0, maxPrice = Number.MAX_SAFE_INTEGER, sortBy = 'purchase_date') {
        try {
            let query = `
                SELECT p.*, s.price, s.change, s.industry, s.image_src, s.marketCap, 
                       s.dividendAmount, s.headquarters, s.peRatio
                FROM ${this.tableName} p
                JOIN stocks s ON p.stock_name = s.name
                WHERE p.user_id = $1
            `;
            
            const queryParams = [userId];
            let paramCount = 2;
            
            // Add industry filter if provided
            if (industry && industry !== 'All') {
                query += ` AND s.industry = $${paramCount}`;
                queryParams.push(industry);
                paramCount++;
            }
            
            // Add price range filter
            query += ` AND s.price >= $${paramCount} AND s.price <= $${paramCount + 1}`;
            queryParams.push(minPrice, maxPrice);
            
            // Add sorting
            switch (sortBy) {
                case 'price':
                    query += ` ORDER BY s.price DESC`;
                    break;
                case 'quantity':
                    query += ` ORDER BY p.quantity DESC`;
                    break;
                case 'marketCap':
                    query += ` ORDER BY s.marketCap DESC`;
                    break;
                case 'change':
                    query += ` ORDER BY s.change DESC`;
                    break;
                case 'dividendAmount':
                    query += ` ORDER BY s.dividendAmount DESC`;
                    break;
                default:
                    query += ` ORDER BY p.purchase_date DESC`;
            }
            
            const result = await pool.query(query, queryParams);
            return result.rows;
        } catch (error) {
            console.error('Error getting filtered and sorted portfolio:', error);
            throw error;
        }
    }
}

module.exports = new PortfolioRepo(); 