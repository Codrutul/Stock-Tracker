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
            
            // Create indexes for better performance with large datasets
            await this.createIndexes();
            
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

    // Create indexes for better query performance
    async createIndexes() {
        try {
            // Create index on industry for faster filtering
            await pool.query(`
                CREATE INDEX IF NOT EXISTS idx_stocks_industry 
                ON ${this.tableName}(industry)
            `);
            
            // Create index on price for faster range queries
            await pool.query(`
                CREATE INDEX IF NOT EXISTS idx_stocks_price 
                ON ${this.tableName}(price)
            `);
            
            // Create index on marketCap for faster sorting
            await pool.query(`
                CREATE INDEX IF NOT EXISTS idx_stocks_market_cap 
                ON ${this.tableName}(marketCap)
            `);
            
            console.log('Stock table indexes created');
        } catch (error) {
            console.error('Error creating stock table indexes:', error);
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

    // Get all stocks with pagination for better performance
    async getAllStocks(page = 1, limit = 100) {
        try {
            // Calculate offset based on page number
            const offset = (page - 1) * limit;
            
            // Use pagination to limit results for better performance
            const result = await pool.query(
                `SELECT * FROM ${this.tableName} ORDER BY name LIMIT $1 OFFSET $2`,
                [limit, offset]
            );
            
            // Sanitize numeric values in the results
            const sanitizedRows = result.rows.map(row => {
                return this.sanitizeNumericValues(row);
            });
            
            return sanitizedRows;
        } catch (error) {
            console.error('Error getting all stocks:', error);
            console.log('Using in-memory fallback data');
            return this.data;
        }
    }

    // Get total count of stocks for pagination
    async getTotalStockCount() {
        try {
            const result = await pool.query(`SELECT COUNT(*) FROM ${this.tableName}`);
            return parseInt(result.rows[0].count);
        } catch (error) {
            console.error('Error getting total stock count:', error);
            return this.data.length;
        }
    }

    // Get stocks by industry with pagination
    async getStocksByIndustry(industry, page = 1, limit = 100) {
        try {
            if (industry === 'All') {
                return this.getAllStocks(page, limit);
            }
            
            // Calculate offset based on page number
            const offset = (page - 1) * limit;
            
            const result = await pool.query(
                `SELECT * FROM ${this.tableName} WHERE industry = $1 ORDER BY name LIMIT $2 OFFSET $3`,
                [industry, limit, offset]
            );
            
            return result.rows.map(row => this.sanitizeNumericValues(row));
        } catch (error) {
            console.error('Error getting stocks by industry:', error);
            if (industry === 'All') {
                return this.data;
            }
            return this.data.filter(stock => stock.industry === industry);
        }
    }

    // Get stocks by price range with pagination
    async getStocksByPriceRange(min, max, page = 1, limit = 100) {
        try {
            // Calculate offset based on page number
            const offset = (page - 1) * limit;
            
            const result = await pool.query(
                `SELECT * FROM ${this.tableName} 
                 WHERE price >= $1 AND price <= $2 
                 ORDER BY price DESC LIMIT $3 OFFSET $4`,
                [min, max, limit, offset]
            );
            
            return result.rows.map(row => this.sanitizeNumericValues(row));
        } catch (error) {
            console.error('Error getting stocks by price range:', error);
            return this.data.filter(stock => stock.price >= min && stock.price <= max);
        }
    }

    // Add a new stock
    async addStock(stock) {
        try {
            // Sanitize the stock data to ensure numeric values are valid
            const sanitizedStock = this.sanitizeNumericValues(stock);
            
            const { name, price, amount_owned, change, image_src, marketCap, 
                dividendAmount, industry, headquarters, peRatio } = sanitizedStock;
            
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
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return this.sanitizeNumericValues(result.rows[0]);
        } catch (error) {
            console.error('Error getting stock by name:', error);
            return this.data.find(stock => stock.name === name);
        }
    }

    // Update a stock
    async updateStock(name, stockData) {
        try {
            // Sanitize numeric values to ensure they're valid for PostgreSQL
            const sanitizedData = this.sanitizeNumericValues(stockData);
            
            const fields = Object.keys(sanitizedData).filter(key => key !== 'name');
            const values = fields.map(field => sanitizedData[field]);
            
            // Create SET clause for the SQL query
            const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
            
            const query = `
                UPDATE ${this.tableName} 
                SET ${setClause} 
                WHERE name = $1 
                RETURNING *
            `;
            
            const result = await pool.query(query, [name, ...values]);
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return this.sanitizeNumericValues(result.rows[0]);
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

    // Helper method to sanitize numeric values for PostgreSQL
    sanitizeNumericValues(data) {
        const sanitized = { ...data };
        
        // Fields that should be numeric
        const numericFields = ['price', 'amount_owned', 'change', 'marketCap', 'dividendAmount', 'peRatio'];
        
        for (const field of numericFields) {
            if (field in sanitized) {
                // Ensure the value is a valid number
                if (typeof sanitized[field] === 'string') {
                    sanitized[field] = parseFloat(sanitized[field]);
                }
                
                // Handle NaN or invalid numbers
                if (isNaN(sanitized[field])) {
                    sanitized[field] = 0;
                }
                
                // Make sure we don't have multiple decimal points or other invalid formats
                // Format the number with 2 decimal places
                sanitized[field] = parseFloat(sanitized[field].toFixed(2));
            }
        }
        
        return sanitized;
    }

    // Delete a stock by name
    async deleteStock(name) {
        try {
            const result = await pool.query(
                `DELETE FROM ${this.tableName} WHERE name = $1 RETURNING *`,
                [name]
            );
            
            if (result.rows.length === 0) {
                return null;
            }
            
            return this.sanitizeNumericValues(result.rows[0]);
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
            // More efficient query for checking existence
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
    
    // Get filtered and sorted stocks with pagination
    async getFilteredAndSortedStocks({
        industry = null,
        minPrice = 0,
        maxPrice = Number.MAX_SAFE_INTEGER,
        sortBy = 'name',
        sortDirection = 'ASC',
        page = 1,
        limit = 100
    }) {
        try {
            // Build the query dynamically based on filters
            let query = `SELECT * FROM ${this.tableName} WHERE 1=1`;
            const params = [];
            let paramIndex = 1;
            
            // Add industry filter if specified
            if (industry && industry !== 'All') {
                query += ` AND industry = $${paramIndex++}`;
                params.push(industry);
            }
            
            // Add price range filter
            query += ` AND price >= $${paramIndex++} AND price <= $${paramIndex++}`;
            params.push(minPrice, maxPrice);
            
            // Validate sortBy to prevent SQL injection
            const validSortColumns = ['name', 'price', 'marketCap', 'change', 'dividendAmount', 'amount_owned'];
            const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'name';
            
            // Validate sort direction
            const direction = (sortDirection.toUpperCase() === 'DESC') ? 'DESC' : 'ASC';
            
            // Add sorting
            query += ` ORDER BY ${sortColumn} ${direction}`;
            
            // Add pagination
            const offset = (page - 1) * limit;
            query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
            params.push(limit, offset);
            
            console.log('Executing query:', query, 'with params:', params);
            
            const result = await pool.query(query, params);
            return result.rows.map(row => this.sanitizeNumericValues(row));
        } catch (error) {
            console.error('Error getting filtered and sorted stocks:', error);
            return this.data;
        }
    }
    
    // Get total count of filtered stocks for pagination
    async getFilteredStockCount({
        industry = null,
        minPrice = 0,
        maxPrice = Number.MAX_SAFE_INTEGER
    }) {
        try {
            let query = `SELECT COUNT(*) FROM ${this.tableName} WHERE 1=1`;
            const params = [];
            let paramIndex = 1;
            
            // Add industry filter if specified
            if (industry && industry !== 'All') {
                query += ` AND industry = $${paramIndex++}`;
                params.push(industry);
            }
            
            // Add price range filter
            query += ` AND price >= $${paramIndex++} AND price <= $${paramIndex++}`;
            params.push(minPrice, maxPrice);
            
            const result = await pool.query(query, params);
            return parseInt(result.rows[0].count);
        } catch (error) {
            console.error('Error getting filtered stock count:', error);
            return this.data.length;
        }
    }
}

module.exports = new StockRepo(); 