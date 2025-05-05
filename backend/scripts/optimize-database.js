/**
 * Database Optimization Script
 * This script adds indexes and optimizes queries for the Stock Tracker database.
 * Run this after loading the database with massive data.
 * Run with: node scripts/optimize-database.js
 */

const pool = require('../db');
const { sequelize } = require('../models/sequelize');
const { performance } = require('perf_hooks');

// Flag to track if connections have been closed
let connectionsAreClosed = false;
// Flag to track if Sequelize is connected
let sequelizeConnected = false;

// Listen for Sequelize connection events
sequelize.authenticate()
    .then(() => {
        console.log('✅ Sequelize connection authenticated for optimization script');
        sequelizeConnected = true;
    })
    .catch(err => {
        console.error('❌ Failed to authenticate Sequelize connection:', err);
    });

// Execute a SQL query and measure its performance
async function executeWithTiming(description, query, params = []) {
    console.log(`\n🔍 ${description}`);
    console.log(`Query: ${query}`);
    
    const start = performance.now();
    let result;
    
    try {
        // Use the pool connection which is more stable for multiple queries
        result = await pool.query(query, params);
        const end = performance.now();
        console.log(`✅ Execution time: ${(end - start).toFixed(2)}ms`);
        console.log(`Rows affected/returned: ${result.rowCount}`);
        return result;
    } catch (error) {
        const end = performance.now();
        console.error(`❌ Error (${(end - start).toFixed(2)}ms): ${error.message}`);
        throw error;
    }
}

// Test the performance of a query before and after optimization
async function testQueryPerformance(description, query, params = []) {
    console.log(`\n📊 Testing performance for: ${description}`);
    
    // Execute EXPLAIN ANALYZE to see query plan and timing
    try {
        const explainQuery = `EXPLAIN ANALYZE ${query}`;
        const result = await pool.query(explainQuery, params);
        console.log('Query execution plan:');
        result.rows.forEach(row => console.log(`  ${row['QUERY PLAN']}`));
    } catch (error) {
        console.error(`Error getting execution plan: ${error.message}`);
    }
    
    // Actually execute the query and time it
    const start = performance.now();
    try {
        await pool.query(query, params);
        const end = performance.now();
        console.log(`Execution time: ${(end - start).toFixed(2)}ms\n`);
    } catch (error) {
        const end = performance.now();
        console.error(`Error (${(end - start).toFixed(2)}ms): ${error.message}\n`);
    }
}

async function addDatabaseIndexes() {
    console.log('🔧 Adding database indexes for improved query performance...');
    
    try {
        // Create index on stocks.industry - improves filtering by industry
        await executeWithTiming(
            'Creating index on stocks.industry',
            'CREATE INDEX IF NOT EXISTS idx_stocks_industry ON stocks(industry)'
        );
        
        // Create index on stocks.price - improves range queries and sorting
        await executeWithTiming(
            'Creating index on stocks.price',
            'CREATE INDEX IF NOT EXISTS idx_stocks_price ON stocks(price)'
        );
        
        // Create index on stocks.marketCap - improves sorting by market cap
        await executeWithTiming(
            'Creating index on stocks.marketCap',
            'CREATE INDEX IF NOT EXISTS idx_stocks_market_cap ON stocks(marketCap)'
        );
        
        // Create index on portfolio.userId - improves retrieving user portfolios
        await executeWithTiming(
            'Creating index on portfolio.userId',
            'CREATE INDEX IF NOT EXISTS idx_portfolio_user_id ON portfolios("userId")'
        );
        
        // Create index on portfolio.stockName - improves finding portfolios by stock
        await executeWithTiming(
            'Creating index on portfolio.stockName',
            'CREATE INDEX IF NOT EXISTS idx_portfolio_stock_name ON portfolios("stockName")'
        );
        
        // Create composite index for stock tags - improves tag-stock relationship lookups
        await executeWithTiming(
            'Creating composite index on StockTags',
            'CREATE INDEX IF NOT EXISTS idx_stock_tags_composite ON "StockTags"("stockName", "tagId")'
        );
        
        console.log('✅ Database indexes created successfully');
    } catch (error) {
        console.error('❌ Error creating database indexes:', error);
    }
}

async function optimizeQueries() {
    console.log('\n🔧 Testing and optimizing common queries...');
    
    // Test query for filtering stocks by industry
    await testQueryPerformance(
        'Filtering stocks by industry',
        'SELECT * FROM stocks WHERE industry = $1 ORDER BY name LIMIT 100',
        ['Technology']
    );
    
    // Test query for filtering stocks by price range
    await testQueryPerformance(
        'Filtering stocks by price range',
        'SELECT * FROM stocks WHERE price BETWEEN $1 AND $2 ORDER BY price DESC LIMIT 100',
        [100, 500]
    );
    
    // Test query for getting stocks with pagination (optimized version)
    await testQueryPerformance(
        'Paginated stocks query',
        'SELECT * FROM stocks ORDER BY name LIMIT 50 OFFSET 0'
    );
    
    // Test query for complex filtering and sorting
    await testQueryPerformance(
        'Complex filtering and sorting',
        `SELECT s.* FROM stocks s
         WHERE s.industry = $1 AND s.price BETWEEN $2 AND $3
         ORDER BY s.marketCap DESC LIMIT 100`,
        ['Technology', 50, 1000]
    );
    
    // Test a join query for user portfolios
    await testQueryPerformance(
        'User portfolio with stock details',
        `SELECT p.*, s.price, s.change, s.industry
         FROM portfolios p
         JOIN stocks s ON p."stockName" = s.name
         WHERE p."userId" = $1
         ORDER BY p.quantity * s.price DESC`,
        [1]  // Using a sample userId of 1
    );
    
    // Test a complex query with multiple joins and aggregation
    await testQueryPerformance(
        'Complex aggregation query',
        `SELECT s.industry, COUNT(*) as stock_count, AVG(s.price) as avg_price, 
                MAX(s.marketCap) as max_market_cap
         FROM stocks s
         GROUP BY s.industry
         ORDER BY stock_count DESC`
    );
    
    // Test a query for stocks with specific tags
    await testQueryPerformance(
        'Stocks with specific tags',
        `SELECT s.* FROM stocks s
         JOIN "StockTags" st ON s.name = st."stockName"
         JOIN tags t ON st."tagId" = t.id
         WHERE t.category = $1
         GROUP BY s.name
         ORDER BY s.price DESC
         LIMIT 100`,
        ['performance']  // Sample tag category
    );
}

async function addDatabaseViews() {
    console.log('\n🔧 Creating database views for complex queries...');
    
    // Create a view for stocks with their statistics
    await executeWithTiming(
        'Creating view for stock statistics by industry',
        `CREATE OR REPLACE VIEW stock_industry_stats AS
         SELECT 
             industry,
             COUNT(*) as stock_count,
             AVG(price) as avg_price,
             AVG(change) as avg_change,
             MAX(marketCap) as max_market_cap,
             MIN(marketCap) as min_market_cap,
             SUM(amount_owned) as total_owned
         FROM stocks
         GROUP BY industry
         ORDER BY stock_count DESC`
    );
    
    // Create a view for user portfolio summaries
    await executeWithTiming(
        'Creating view for user portfolio summaries',
        `CREATE OR REPLACE VIEW user_portfolio_summary AS
         SELECT 
             p."userId",
             COUNT(DISTINCT p."stockName") as unique_stocks,
             SUM(p.quantity) as total_shares,
             SUM(p.quantity * s.price) as total_value,
             SUM(p.quantity * s.price * s.change / 100) as total_daily_change
         FROM portfolios p
         JOIN stocks s ON p."stockName" = s.name
         GROUP BY p."userId"`
    );
    
    // Create a materialized view for frequently accessed complex data
    await executeWithTiming(
        'Creating materialized view for stock performance metrics',
        `CREATE MATERIALIZED VIEW IF NOT EXISTS stock_performance_metrics AS
         SELECT 
             s.name,
             s.price,
             s.change,
             s.marketCap,
             s.peRatio,
             s.dividendAmount,
             s.industry,
             COUNT(DISTINCT p."userId") as investor_count,
             SUM(p.quantity) as total_shares_owned,
             ARRAY_AGG(DISTINCT t.name) as tags
         FROM stocks s
         LEFT JOIN portfolios p ON s.name = p."stockName"
         LEFT JOIN "StockTags" st ON s.name = st."stockName"
         LEFT JOIN tags t ON st."tagId" = t.id
         GROUP BY s.name, s.price, s.change, s.marketCap, s.peRatio, s.dividendAmount, s.industry
         WITH DATA`
    );
    
    // Create index on the materialized view
    await executeWithTiming(
        'Creating index on materialized view',
        'CREATE INDEX IF NOT EXISTS idx_stock_perf_industry ON stock_performance_metrics(industry)'
    );
    
    console.log('✅ Database views created successfully');
}

async function addStoredProcedures() {
    console.log('\n🔧 Creating stored procedures for common operations...');
    
    // Create a stored procedure for updating stock prices (batch update)
    await executeWithTiming(
        'Creating procedure for batch updating stock prices',
        `CREATE OR REPLACE PROCEDURE update_stock_prices(price_change_pct DECIMAL)
         LANGUAGE plpgsql
         AS $$
         BEGIN
             UPDATE stocks 
             SET price = price * (1 + price_change_pct/100),
                 change = price_change_pct;
             COMMIT;
         END;
         $$;`
    );
    
    // Create a function to get a user's portfolio total value
    await executeWithTiming(
        'Creating function for calculating portfolio value',
        `CREATE OR REPLACE FUNCTION get_portfolio_value(user_id INTEGER)
         RETURNS TABLE (
             total_value DECIMAL,
             total_change DECIMAL
         )
         LANGUAGE plpgsql
         AS $$
         BEGIN
             RETURN QUERY
             SELECT 
                 SUM(p.quantity * s.price) as total_value,
                 SUM(p.quantity * s.price * s.change / 100) as total_change
             FROM portfolios p
             JOIN stocks s ON p."stockName" = s.name
             WHERE p."userId" = user_id;
         END;
         $$;`
    );
    
    console.log('✅ Stored procedures created successfully');
}

// Safely close connections
async function closeConnections() {
    console.log('\n🔄 Closing database connections...');
    
    try {
        if (!connectionsAreClosed) {
            // Close Sequelize connection first
            await sequelize.close();
            console.log('✅ Sequelize connection closed');
            
            // Close the pool (with timeout to ensure it completes)
            await new Promise((resolve, reject) => {
                pool.end(err => {
                    if (err) {
                        console.error('❌ Error closing pool:', err);
                        reject(err);
                    } else {
                        console.log('✅ Connection pool closed');
                        resolve();
                    }
                });
            });
            
            connectionsAreClosed = true;
            console.log('✅ All database connections closed successfully');
        }
    } catch (error) {
        console.error('❌ Error closing connections:', error);
        // Even if there's an error, mark as closed to prevent further attempts
        connectionsAreClosed = true;
    }
}

// Handle unexpected termination
process.on('SIGINT', async () => {
    console.log('\n🛑 Process interrupted. Cleaning up...');
    await closeConnections();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Process terminated. Cleaning up...');
    await closeConnections();
    process.exit(0);
});

async function main() {
    try {
        console.log('🚀 Starting database optimization...');
        
        // Wait for connections to be properly established
        if (!sequelizeConnected) {
            console.log('⏳ Waiting for Sequelize connection to be established...');
            let attempts = 0;
            while (!sequelizeConnected && attempts < 10) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                attempts++;
                console.log(`Connection attempt ${attempts}/10...`);
            }
            
            if (!sequelizeConnected) {
                throw new Error('Failed to establish Sequelize connection after multiple attempts');
            }
        }
        
        console.log('✅ Connections established, proceeding with optimization tasks');
        
        // Run the optimization tasks
        await addDatabaseIndexes();
        await optimizeQueries();
        await addDatabaseViews();
        await addStoredProcedures();
        
        console.log('\n✅ Database optimization completed successfully!');
    } catch (error) {
        console.error('❌ Database optimization failed:', error);
    } finally {
        await closeConnections();
    }
}

// Run the main function
main().catch(error => {
    console.error('❌ Unhandled error in main function:', error);
    closeConnections().finally(() => process.exit(1));
}); 