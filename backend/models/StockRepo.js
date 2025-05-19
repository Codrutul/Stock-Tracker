const Stock = require('./Stock');
const pool = require('../db');
const { StockModel } = require('./sequelize');

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
            
            // Create index on market_cap for faster sorting (column is snake_case due to Sequelize underscored: true)
            await pool.query(`
                CREATE INDEX IF NOT EXISTS idx_stocks_market_cap 
                ON ${this.tableName}(market_cap)
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
            console.log(`🔄 StockRepo: Attempting to add stock: ${stock.name}`);
            
            // Sanitize the stock data to ensure numeric values are valid
            const sanitizedStock = this.sanitizeNumericValues(stock);
            
            const { name, price, amount_owned, change, image_src, marketCap, 
                dividendAmount, industry, headquarters, peRatio } = sanitizedStock;
            
            console.log(`📊 StockRepo: Sanitized values for ${name}:`);
            console.log(`  - price: ${price}`);
            console.log(`  - amount_owned: ${amount_owned}`);
            console.log(`  - change: ${change}`);
            console.log(`  - marketCap: ${marketCap}`);
            console.log(`  - dividendAmount: ${dividendAmount}`);
            console.log(`  - industry: ${industry}`);
            console.log(`  - headquarters: ${headquarters}`);
            console.log(`  - peRatio: ${peRatio}`);
            
            // Insert into raw SQL database
            const result = await pool.query(
                `INSERT INTO ${this.tableName} 
                (name, price, amount_owned, change, image_src, marketCap, 
                dividendAmount, industry, headquarters, peRatio) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
                RETURNING *`,
                [name, price, amount_owned, change, image_src, marketCap, 
                dividendAmount, industry, headquarters, peRatio]
            );
            
            // Also insert into Sequelize model for persistence
            try {
                await StockModel.findOrCreate({
                    where: { name },
                    defaults: {
                        price,
                        amount_owned,
                        change,
                        image_src,
                        marketCap,
                        dividendAmount,
                        industry,
                        headquarters,
                        peRatio
                    }
                });
                console.log(`✅ StockRepo: Synchronized stock with Sequelize: ${name}`);
            } catch (seqError) {
                console.error(`❌ StockRepo: Error syncing with Sequelize for ${name}:`, seqError);
                // Continue anyway since we have the raw SQL insertion
            }
            
            if (result.rows.length === 0) {
                console.log(`❌ StockRepo: No data returned after inserting stock: ${name}`);
                return null;
            }
            
            console.log(`✅ StockRepo: Successfully added stock: ${name}`);
            return result.rows[0];
        } catch (error) {
            console.error(`❌ StockRepo: Error adding stock ${stock.name}:`, error);
            console.log(`🔄 StockRepo: Falling back to in-memory data for: ${stock.name}`);
            
            try {
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
                console.log(`✅ StockRepo: Successfully added stock to in-memory data: ${stock.name}`);
                
                // Try adding to Sequelize as a last resort
                try {
                    await StockModel.create({
                        name: stock.name,
                        price: stock.price,
                        amount_owned: stock.amount_owned,
                        change: stock.change,
                        image_src: stock.image_src,
                        marketCap: stock.marketCap,
                        dividendAmount: stock.dividendAmount,
                        industry: stock.industry,
                        headquarters: stock.headquarters,
                        peRatio: stock.peRatio
                    });
                    console.log(`✅ StockRepo: Added to Sequelize as fallback for: ${stock.name}`);
                } catch (seqError) {
                    console.error(`❌ StockRepo: Sequelize fallback also failed for ${stock.name}:`, seqError);
                }
                
                return newStock;
            } catch (inMemoryError) {
                console.error(`❌ StockRepo: Error adding stock to in-memory data: ${stock.name}`, inMemoryError);
                throw new Error(`Failed to add stock to database or in-memory: ${error.message}`);
            }
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
            
            // Also update Sequelize model for persistence
            try {
                const stockInSequelize = await StockModel.findByPk(name);
                if (stockInSequelize) {
                    await stockInSequelize.update(sanitizedData);
                    console.log(`✅ StockRepo: Synchronized update with Sequelize: ${name}`);
                } else {
                    // If it doesn't exist in Sequelize, create it
                    await StockModel.create({
                        name,
                        ...sanitizedData
                    });
                    console.log(`✅ StockRepo: Created in Sequelize during update: ${name}`);
                }
            } catch (seqError) {
                console.error(`❌ StockRepo: Error syncing update with Sequelize for ${name}:`, seqError);
                // Continue anyway since we have the raw SQL update
            }
            
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
                
                // Try updating Sequelize as a last resort
                try {
                    await StockModel.upsert({
                        name,
                        ...stockData
                    });
                    console.log(`✅ StockRepo: Updated Sequelize as fallback for: ${name}`);
                } catch (seqError) {
                    console.error(`❌ StockRepo: Sequelize update fallback failed for ${name}:`, seqError);
                }
                
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
            console.log(`🔄 StockRepo: Attempting to delete stock from database: ${name}`);
            
            // First verify the stock exists
            const exists = await this.stockExists(name);
            if (!exists) {
                console.log(`❌ StockRepo: Stock does not exist: ${name}`);
                return null;
            }
            
            const result = await pool.query(
                `DELETE FROM ${this.tableName} WHERE name = $1 RETURNING *`,
                [name]
            );
            
            // Also delete from Sequelize model for consistency
            try {
                await StockModel.destroy({
                    where: { name }
                });
                console.log(`✅ StockRepo: Synchronized deletion with Sequelize: ${name}`);
            } catch (seqError) {
                console.error(`❌ StockRepo: Error syncing deletion with Sequelize for ${name}:`, seqError);
                // Continue anyway since we have the raw SQL deletion
            }
            
            if (result.rows.length === 0) {
                console.log(`❌ StockRepo: No rows deleted for stock: ${name}`);
                return null;
            }
            
            console.log(`✅ StockRepo: Successfully deleted stock: ${name}`);
            return this.sanitizeNumericValues(result.rows[0]);
        } catch (error) {
            console.error(`❌ StockRepo: Error deleting stock ${name}:`, error);
            
            // Attempt to fall back to in-memory data
            console.log(`🔄 StockRepo: Attempting in-memory fallback for delete operation on: ${name}`);
            const stockIndex = this.data.findIndex(stock => stock.name === name);
            
            if (stockIndex !== -1) {
                const deletedStock = this.data[stockIndex];
                this.data.splice(stockIndex, 1);
                console.log(`✅ StockRepo: Successfully deleted stock from in-memory data: ${name}`);
                
                // Try deleting from Sequelize as a last resort
                try {
                    await StockModel.destroy({
                        where: { name }
                    });
                    console.log(`✅ StockRepo: Deleted from Sequelize as fallback for: ${name}`);
                } catch (seqError) {
                    console.error(`❌ StockRepo: Sequelize deletion fallback failed for ${name}:`, seqError);
                }
                
                return deletedStock;
            }
            
            console.log(`❌ StockRepo: In-memory fallback also failed for stock: ${name}`);
            throw new Error(`Failed to delete stock: ${error.message}`);
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
            const direction = (sortDirection && sortDirection.toUpperCase() === 'DESC') ? 'DESC' : 'ASC';
            console.log(`🔄 StockRepo: Sorting by ${sortColumn} in ${direction} order`);
            
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