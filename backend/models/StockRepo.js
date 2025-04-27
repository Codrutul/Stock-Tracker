const Stock = require('./Stock');
const pool = require('../db');

class StockRepo {
    constructor() {
        this.tableName = 'stocks';
        this.data = []; // Fallback for when database is not available
    }

    // Initialize the database table
    async initialize() {
        try {
            // Try to create the table if it doesn't exist
            await pool.query(`
                CREATE TABLE IF NOT EXISTS ${this.tableName} (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL UNIQUE,
                    price NUMERIC NOT NULL,
                    amount_owned NUMERIC DEFAULT 0,
                    change NUMERIC DEFAULT 0,
                    image_src VARCHAR(255),
                    marketCap NUMERIC DEFAULT 0,
                    dividendAmount NUMERIC DEFAULT 0,
                    industry VARCHAR(100) DEFAULT '',
                    headquarters VARCHAR(255) DEFAULT '',
                    peRatio NUMERIC DEFAULT 0
                )
            `);
            console.log('Stock table initialized');
            return true;
        } catch (error) {
            console.error('Error initializing stock table:', error);
            console.log('Using in-memory fallback for stock data');
            // Initialize with default data when database is not available
            this.initializeInMemoryData();
            return false;
        }
    }

    // Initialize in-memory fallback data
    initializeInMemoryData() {
        // Add some sample data for testing
        const apple = new Stock(
            "Apple",
            193,
            10,
            -5,
            "src/assets/apple.png",
            2930000000000,
            0.96,
            "Technology",
            "Cupertino, CA",
            30.12
        );
        
        const tesla = new Stock(
            "Tesla",
            177,
            20,
            -20,
            "src/assets/tesla.png",
            565000000000,
            0,
            "Automotive",
            "Austin, TX",
            62.18
        );
        
        const amazon = new Stock(
            "Amazon",
            178.15,
            0,
            25,
            "src/assets/amazon.png",
            1860000000000,
            0,
            "Consumer Cyclical",
            "Seattle, WA",
            43.21
        );
        
        this.data = [apple, tesla, amazon];
    }

    // Get all stocks
    async getAllStocks() {
        try {
            const result = await pool.query(`SELECT * FROM ${this.tableName}`);
            return result.rows;
        } catch (error) {
            console.error('Error getting all stocks:', error);
            console.log('Using in-memory fallback data');
            return this.data;
        }
    }

    // Get stocks by industry
    async getStocksByIndustry(industry) {
        try {
            if (industry === 'All') {
                return this.getAllStocks();
            }
            const result = await pool.query(
                `SELECT * FROM ${this.tableName} WHERE industry = $1`,
                [industry]
            );
            return result.rows;
        } catch (error) {
            console.error('Error getting stocks by industry:', error);
            if (industry === 'All') {
                return this.data;
            }
            return this.data.filter(stock => stock.industry === industry);
        }
    }

    // Get stocks by price range
    async getStocksByPriceRange(min, max) {
        try {
            const result = await pool.query(
                `SELECT * FROM ${this.tableName} WHERE price >= $1 AND price <= $2`,
                [min, max]
            );
            return result.rows;
        } catch (error) {
            console.error('Error getting stocks by price range:', error);
            return this.data.filter(stock => stock.price >= min && stock.price <= max);
        }
    }

    // Add a new stock
    async addStock(stock) {
        try {
            const { name, price, amount_owned, change, image_src, marketCap, 
                dividendAmount, industry, headquarters, peRatio } = stock;
            
            const result = await pool.query(
                `INSERT INTO ${this.tableName} 
                (name, price, amount_owned, change, image_src, marketCap, 
                dividendAmount, industry, headquarters, peRatio) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
                RETURNING *`,
                [name, price, amount_owned, change, image_src, marketCap, 
                dividendAmount, industry, headquarters, peRatio]
            );
            
            return result.rows[0];
        } catch (error) {
            console.error('Error adding stock:', error);
            // Add to in-memory data if database fails
            const newStock = new Stock(
                stock.name,
                stock.price,
                stock.amount_owned,
                stock.change,
                stock.image_src,
                stock.marketCap,
                stock.dividendAmount,
                stock.industry,
                stock.headquarters,
                stock.peRatio
            );
            this.data.push(newStock);
            return newStock;
        }
    }

    // Get a stock by name
    async getStockByName(name) {
        try {
            const result = await pool.query(
                `SELECT * FROM ${this.tableName} WHERE name = $1`,
                [name]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error getting stock by name:', error);
            return this.data.find(stock => stock.name === name);
        }
    }

    // Update a stock
    async updateStock(name, stockData) {
        try {
            const fields = Object.keys(stockData).filter(key => key !== 'name');
            const values = fields.map(field => stockData[field]);
            
            // Create SET clause for the SQL query
            const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
            
            const query = `
                UPDATE ${this.tableName} 
                SET ${setClause} 
                WHERE name = $1 
                RETURNING *
            `;
            
            const result = await pool.query(query, [name, ...values]);
            return result.rows[0];
        } catch (error) {
            console.error('Error updating stock:', error);
            // Update in-memory data if database fails
            const stockIndex = this.data.findIndex(stock => stock.name === name);
            if (stockIndex !== -1) {
                Object.assign(this.data[stockIndex], stockData);
                return this.data[stockIndex];
            }
            return null;
        }
    }

    // Delete a stock by name
    async deleteStock(name) {
        try {
            const result = await pool.query(
                `DELETE FROM ${this.tableName} WHERE name = $1 RETURNING *`,
                [name]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error deleting stock:', error);
            // Delete from in-memory data if database fails
            const stockIndex = this.data.findIndex(stock => stock.name === name);
            if (stockIndex !== -1) {
                const deletedStock = this.data[stockIndex];
                this.data.splice(stockIndex, 1);
                return deletedStock;
            }
            return null;
        }
    }

    // Check if stock exists by name
    async stockExists(name) {
        try {
            const result = await pool.query(
                `SELECT EXISTS(SELECT 1 FROM ${this.tableName} WHERE name = $1)`,
                [name]
            );
            return result.rows[0].exists;
        } catch (error) {
            console.error('Error checking if stock exists:', error);
            // Check in-memory data if database fails
            return this.data.some(stock => stock.name === name);
        }
    }
}

module.exports = new StockRepo(); 