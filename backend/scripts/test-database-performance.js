/**
 * Database Performance Testing Script
 * This script tests the performance of various database operations before and after optimizations.
 * Run with: node scripts/test-database-performance.js
 */

const pool = require('../db');
const { performance } = require('perf_hooks');
const { sequelize } = require('../models/sequelize');
const fs = require('fs');
const path = require('path');

// Configure the test
const ITERATIONS = 5; // Number of times to run each test for averaging
const OUTPUT_FILE = path.join(__dirname, '../tests/performance-results.json');

// Utility to measure execution time
async function timeExecution(description, queryFn) {
    console.log(`\n🔍 Testing: ${description}`);
    
    const times = [];
    let totalRows = 0;
    
    for (let i = 0; i < ITERATIONS; i++) {
        const start = performance.now();
        let result;
        
        try {
            result = await queryFn();
            const end = performance.now();
            const duration = end - start;
            times.push(duration);
            
            totalRows = Array.isArray(result) ? result.length : (result.rowCount || 0);
            
            console.log(`  Run ${i + 1}: ${duration.toFixed(2)}ms (${totalRows} rows)`);
        } catch (error) {
            console.error(`  Run ${i + 1} failed: ${error.message}`);
            times.push(null);
        }
    }
    
    // Calculate statistics
    const validTimes = times.filter(t => t !== null);
    const avgTime = validTimes.length > 0 
        ? validTimes.reduce((sum, t) => sum + t, 0) / validTimes.length 
        : null;
    
    console.log(`✅ Result for ${description}:`);
    console.log(`  Average time: ${avgTime ? avgTime.toFixed(2) : 'N/A'}ms`);
    console.log(`  Success rate: ${validTimes.length}/${ITERATIONS}`);
    console.log(`  Rows: ${totalRows}`);
    
    return {
        description,
        averageTime: avgTime,
        successRate: `${validTimes.length}/${ITERATIONS}`,
        times: validTimes,
        rowCount: totalRows
    };
}

// Database queries to test
const tests = [
    {
        name: 'Get all stocks (no limit)',
        query: () => pool.query('SELECT * FROM stocks'),
    },
    {
        name: 'Get all stocks (with limit)',
        query: () => pool.query('SELECT * FROM stocks LIMIT 100'),
    },
    {
        name: 'Get stocks by industry',
        query: () => pool.query('SELECT * FROM stocks WHERE industry = $1 LIMIT 100', ['Technology']),
    },
    {
        name: 'Get stocks by price range',
        query: () => pool.query('SELECT * FROM stocks WHERE price BETWEEN $1 AND $2 LIMIT 100', [100, 500]),
    },
    {
        name: 'Get stocks sorted by market cap',
        query: () => pool.query('SELECT * FROM stocks ORDER BY "marketCap" DESC LIMIT 100'),
    },
    {
        name: 'Get stocks with complex filtering',
        query: () => pool.query(`
            SELECT s.* FROM stocks s
            WHERE s.industry = $1 AND s.price BETWEEN $2 AND $3
            ORDER BY s.marketCap DESC LIMIT 100
        `, ['Technology', 50, 1000]),
    },
    {
        name: 'Join query - stocks with portfolios',
        query: () => pool.query(`
            SELECT s.name, s.price, COUNT(p."userId") as investor_count
            FROM stocks s
            LEFT JOIN portfolios p ON s.name = p."stockName"
            GROUP BY s.name, s.price
            ORDER BY investor_count DESC
            LIMIT 100
        `),
    },
    {
        name: 'Complex query with multiple joins',
        query: () => pool.query(`
            SELECT s.name, s.price, s.industry, 
                   COUNT(DISTINCT p."userId") as investor_count,
                   ARRAY_AGG(DISTINCT t.name) as tags
            FROM stocks s
            LEFT JOIN portfolios p ON s.name = p."stockName"
            LEFT JOIN "StockTags" st ON s.name = st."stockName"
            LEFT JOIN tags t ON st."tagId" = t.id
            GROUP BY s.name, s.price, s.industry
            ORDER BY investor_count DESC
            LIMIT 50
        `),
    },
    {
        name: 'Counting records with grouping',
        query: () => pool.query(`
            SELECT s.industry, COUNT(*) as stock_count, AVG(s.price) as avg_price
            FROM stocks s
            GROUP BY s.industry
            ORDER BY stock_count DESC
        `),
    },
    {
        name: 'Stock lookup by name',
        query: () => pool.query('SELECT * FROM stocks WHERE name = $1', ['Apple']),
    }
];

// Run all performance tests
async function runPerformanceTests() {
    console.log('🚀 Starting database performance tests...');
    
    const results = [];
    
    for (const test of tests) {
        const result = await timeExecution(test.name, test.query);
        results.push(result);
    }
    
    // Save results to file
    try {
        const resultsDir = path.dirname(OUTPUT_FILE);
        if (!fs.existsSync(resultsDir)) {
            fs.mkdirSync(resultsDir, { recursive: true });
        }
        
        fs.writeFileSync(
            OUTPUT_FILE, 
            JSON.stringify({
                timestamp: new Date().toISOString(),
                results
            }, null, 2)
        );
        
        console.log(`\n✅ Results saved to ${OUTPUT_FILE}`);
    } catch (err) {
        console.error(`\n❌ Error saving results: ${err.message}`);
    }
    
    return results;
}

// Function to test the materialized view performance
async function testMaterializedView() {
    console.log('\n🔍 Testing materialized view performance:');
    
    try {
        // Check if materialized view exists
        const checkView = await pool.query(`
            SELECT EXISTS (
                SELECT FROM pg_matviews
                WHERE matviewname = 'stock_performance_metrics'
            )
        `);
        
        if (!checkView.rows[0].exists) {
            console.log('❌ Materialized view does not exist. Run optimize-database.js first.');
            return;
        }
        
        // Compare performance of materialized view vs equivalent query
        const viewResult = await timeExecution(
            'Query using materialized view', 
            () => pool.query('SELECT * FROM stock_performance_metrics LIMIT 100')
        );
        
        const directResult = await timeExecution(
            'Same query without materialized view',
            () => pool.query(`
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
                LIMIT 100
            `)
        );
        
        if (viewResult.averageTime && directResult.averageTime) {
            const improvement = ((directResult.averageTime - viewResult.averageTime) / directResult.averageTime) * 100;
            console.log(`\n📊 Materialized view performance improvement: ${improvement.toFixed(2)}%`);
            console.log(`  View query: ${viewResult.averageTime.toFixed(2)}ms`);
            console.log(`  Direct query: ${directResult.averageTime.toFixed(2)}ms`);
        }
    } catch (error) {
        console.error('❌ Error testing materialized view:', error.message);
    }
}

// Test stored procedures if they exist
async function testStoredProcedures() {
    console.log('\n🔍 Testing stored procedures:');
    
    try {
        // Check if portfolio value function exists
        const checkFunc = await pool.query(`
            SELECT EXISTS (
                SELECT FROM pg_proc
                WHERE proname = 'get_portfolio_value'
            )
        `);
        
        if (!checkFunc.rows[0].exists) {
            console.log('❌ Stored procedures do not exist. Run optimize-database.js first.');
            return;
        }
        
        // Test the portfolio value function
        const funcResult = await timeExecution(
            'Query using get_portfolio_value function', 
            () => pool.query('SELECT * FROM get_portfolio_value(1)')
        );
        
        // Compare with equivalent direct query
        const directResult = await timeExecution(
            'Same calculation without function',
            () => pool.query(`
                SELECT 
                    SUM(p.quantity * s.price) as total_value,
                    SUM(p.quantity * s.price * s.change / 100) as total_change
                FROM portfolios p
                JOIN stocks s ON p."stockName" = s.name
                WHERE p."userId" = 1
            `)
        );
        
        if (funcResult.averageTime && directResult.averageTime) {
            const improvement = ((directResult.averageTime - funcResult.averageTime) / directResult.averageTime) * 100;
            console.log(`\n📊 Stored procedure performance improvement: ${improvement.toFixed(2)}%`);
            console.log(`  Function call: ${funcResult.averageTime.toFixed(2)}ms`);
            console.log(`  Direct query: ${directResult.averageTime.toFixed(2)}ms`);
        }
    } catch (error) {
        console.error('❌ Error testing stored procedures:', error.message);
    }
}

// Main function to run all tests
async function main() {
    try {
        // Run basic performance tests
        await runPerformanceTests();
        
        // Test materialized views
        await testMaterializedView();
        
        // Test stored procedures
        await testStoredProcedures();
        
        console.log('\n🎉 Performance testing completed successfully!');
    } catch (error) {
        console.error('❌ Error during performance testing:', error);
    } finally {
        // Close connections
        await pool.end();
        await sequelize.close();
    }
}

// Run the tests
main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
}); 